import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getReadingPrice, isDailyFreeSpread } from '../services/pricing';
import { isPaidFor } from '../services/paid-mode';
import { claimDailyFree, InsufficientPointsError, linkSpendToReading, refundSpend, releaseDailyFree, spendPoints } from '../services/point.service';
import { TarotService } from '../services/tarot.service';
import aiService from '../services/ai.service';
import { SPREAD_POSITIONS, type SpreadType, type CustomPosition } from '../models/tarot.model';
import { sanitizeCustomPositions, cleanSpreadText } from '../utils/custom-spread';
import { createUserRateLimiter } from '../utils/user-rate-limit';

// 맞춤 배치 대화: 한 번 만들 때 최대 6회(첫 제안 + 수정 5회) 호출되므로 10분에 20회면 3번 정도 만들 수 있다
const allowDesignSpread = createUserRateLimiter(20, 10 * 60 * 1000);
const MAX_DESIGN_USER_TURNS = 5;

// 타로 리딩: 한 번에 AI를 2~3회(분석 → 해석, 실패 시 레거시) 호출하고 카드 고르는 데도 시간이 걸리므로
// 10분에 10회면 일반 사용에는 닿지 않고 반복 호출만 막는다
const allowAIReading = createUserRateLimiter(10, 10 * 60 * 1000);
const MAX_QUESTION_LENGTH = 200; // 클라이언트 질문 입력창 maxLength와 같게

const tarotService = new TarotService();

// 이전 리딩을 다음 리딩 프롬프트 재료로 정리
// 저장된 값도 사용 시 다시 정리한다 (cleanSpreadText: 보이지 않는 문자·따옴표·줄바꿈 제거 + 길이 제한)
const describeDrawnCard = (dc: unknown): string => {
  if (!dc || typeof dc !== 'object') return '';
  const { positionMeaning, isReversed, card } = dc as { positionMeaning?: unknown; isReversed?: unknown; card?: { nameKo?: unknown } };
  const name = cleanSpreadText(card?.nameKo, 30);
  if (!name) return '';
  const position = cleanSpreadText(positionMeaning, 30);
  return `${position ? `${position}:` : ''}${name}(${isReversed === true ? '역' : '정'})`;
};

function toPreviousReading(r: { question: string; createdAt: Date; interpretation: string; drawnCards: unknown; easyReading: unknown }) {
  const cards = Array.isArray(r.drawnCards) ? r.drawnCards.map(describeDrawnCard).filter(Boolean).join(', ') : '';
  const headline = r.easyReading && typeof r.easyReading === 'object'
    ? (r.easyReading as { headline?: unknown }).headline
    : undefined;
  return {
    date: r.createdAt.toISOString().split('T')[0],
    question: cleanSpreadText(r.question, 200),
    // interpretation은 "요약 ===CARD_DETAILS=== 상세" 형식이라 요약만 쓴다
    summary: cleanSpreadText(r.interpretation.split('===CARD_DETAILS===')[0], 300),
    cards: cleanSpreadText(cards, 300),
    headline: cleanSpreadText(headline, 60)
  };
}

// 질문 분석 및 스프레드 추천
export const analyzeQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { question }: { question: string } = req.body;

    if (!question || question.trim().length < 5) {
      res.status(400).json({ error: '질문을 5자 이상 입력해주세요.' });
      return;
    }

    // AI가 질문을 분석하고 스프레드 추천
    const recommendation = await aiService.analyzeQuestionAndRecommendSpread(question);

    res.json({
      success: true,
      data: recommendation
    });
  } catch (error) {
    console.error('질문 분석 오류:', error);
    res.status(500).json({ error: '질문 분석 중 오류가 발생했습니다.' });
  }
};

// 대화로 맞춤 배치 설계
export const designSpread = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    if (!allowDesignSpread(req.user.userId)) {
      res.status(429).json({ error: '맞춤 배치 요청이 너무 많아요. 10분 뒤에 다시 시도해 주세요.' });
      return;
    }

    const { question, messages, current } = req.body as { question?: unknown; messages?: unknown; current?: unknown };

    if (typeof question !== 'string' || question.trim().length < 5 || question.length > 200) {
      res.status(400).json({ error: '질문을 5~200자로 입력해주세요.' });
      return;
    }

    const rawMessages = Array.isArray(messages) ? messages : [];
    if (rawMessages.length > 10) {
      res.status(400).json({ error: '대화가 너무 길어요. 처음부터 다시 만들어주세요.' });
      return;
    }

    // 줄바꿈·따옴표를 정리해 프롬프트의 규칙 블록을 흉내 내지 못하게 한다
    const history = rawMessages
      .filter((m): m is { role: unknown; content: unknown } => !!m && typeof m === 'object')
      .filter(m => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: cleanSpreadText(m.content, 300) }))
      .filter(m => m.content);

    if (history.filter(m => m.role === 'user').length > MAX_DESIGN_USER_TURNS) {
      res.status(400).json({ error: `수정은 ${MAX_DESIGN_USER_TURNS}번까지 할 수 있어요. 처음부터 다시 만들어주세요.` });
      return;
    }

    // 탈퇴한 계정의 토큰으로 AI를 계속 부르지 못하게 확인
    const userExists = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true } });
    if (!userExists) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    let currentDesign: { name: string; positions: CustomPosition[] } | null = null;
    if (current && typeof current === 'object') {
      const positions = sanitizeCustomPositions((current as Record<string, unknown>).positions);
      if (positions) {
        currentDesign = { name: cleanSpreadText((current as Record<string, unknown>).name, 15) || '맞춤 배치', positions };
      }
    }

    const design = await aiService.designCustomSpread(cleanSpreadText(question, 200), history, currentDesign);
    res.json({ success: true, data: design });
  } catch (error) {
    console.error('맞춤 배치 설계 오류:', error);
    res.status(500).json({ error: '맞춤 배치를 만드는 중 오류가 발생했습니다.' });
  }
};

// 상대방 정보로 사주를 계산하지 못함 (궁합 리딩)
class PartnerInfoError extends Error {}

// AI 기반 통합 해석
export const getAIIntegratedReading = async (req: Request, res: Response): Promise<void> => {
  // 포인트를 차감한 뒤 리딩이 실패하면 catch에서 되돌린다
  let spent: { userId: string; cost: number; transactionId: string } | null = null;
  // 오늘의 무료를 차지한 뒤 리딩이 실패하면 catch에서 되돌린다
  let freeClaim: { userId: string; spreadType: string } | null = null;
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { question, spreadType, includeAdviceCard, cardPositions, selectedCards, sajuAnalysis: clientSajuAnalysis, partnerBirthInfo, partnerMbti, customPositions: rawCustomPositions }: {
      question: string;
      spreadType: SpreadType;
      includeAdviceCard?: boolean;
      cardPositions?: number[]; // 하위 호환성 유지
      selectedCards?: { cardIndex: number; isReversed: boolean }[]; // 새로운 형식
      sajuAnalysis?: any;
      partnerBirthInfo?: any; // 상대방 생년월일 (궁합용)
      partnerMbti?: string;   // 상대방 MBTI (선택)
      customPositions?: unknown; // 맞춤 배치 자리 (spreadType === 'custom')
    } = req.body;

    if (!spreadType) {
      res.status(400).json({ error: '스프레드 타입을 입력해주세요.' });
      return;
    }

    if (typeof spreadType !== 'string' || !Object.prototype.hasOwnProperty.call(SPREAD_POSITIONS, spreadType)) {
      res.status(400).json({ error: '지원하지 않는 스프레드 타입입니다.' });
      return;
    }

    // 맞춤 배치는 클라이언트가 보낸 자리를 서버에서 다시 검증
    const customPositions = spreadType === 'custom' ? sanitizeCustomPositions(rawCustomPositions) : null;
    if (spreadType === 'custom' && !customPositions) {
      res.status(400).json({ error: '맞춤 배치 정보가 올바르지 않습니다.' });
      return;
    }

    // 질문 타입·길이 확인 (빈 질문은 화면이 "오늘의 운세를 봐주세요"로 채워 보낸다)
    // 프롬프트에는 보이지 않는 문자·따옴표를 정리한 질문을 넣고, DB에는 원문을 저장한다
    // (화면 꺼짐 복구가 저장된 질문과 보낸 질문을 그대로 비교하기 때문)
    const promptQuestion = cleanSpreadText(question, MAX_QUESTION_LENGTH);
    if (typeof question !== 'string' || question.length > MAX_QUESTION_LENGTH || !promptQuestion) {
      res.status(400).json({ error: `질문은 1~${MAX_QUESTION_LENGTH}자로 입력해주세요.` });
      return;
    }

    // 입력 검증을 통과한 요청만 횟수에 센다
    if (!allowAIReading(req.user.userId)) {
      res.status(429).json({ error: '리딩 요청이 너무 많아요. 10분 뒤에 다시 시도해주세요.' });
      return;
    }

    // 사용자 정보 조회 (mbti 필드는 Prisma 마이그레이션 후 사용 가능)
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    }) as any;
    
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    // 요금 계산과 차감 (가격표: services/pricing.ts). AI를 부르기 전에 차감해 잔액 없이 비용이 나가지 않게 한다.
    // 상대 정보는 객체일 때만 궁합으로 본다 — 아래 사주 분석도 같은 값을 쓴다
    const hasPartner = !!partnerBirthInfo && typeof partnerBirthInfo === 'object' && !Array.isArray(partnerBirthInfo);
    // 유료 전환 전(PAID_MODE off)에는 요금을 받지 않는다 — 무료 사용 기록도 남기지 않는다
    const paid = isPaidFor(req.user.email);
    // 하루 1회 무료는 "확인 후 기록"이 아니라 기록을 먼저 차지한다 — 동시에 여러 번 요청해도 하나만 무료
    let usedFreeToday = false;
    if (paid && !hasPartner && isDailyFreeSpread(spreadType)) {
      if (await claimDailyFree(user.id, spreadType)) {
        freeClaim = { userId: user.id, spreadType };
      } else {
        usedFreeToday = true;
      }
    }
    const cost = paid ? getReadingPrice(spreadType, hasPartner, usedFreeToday) : 0;
    let pointsAfter: number = user.points ?? 0;
    if (cost > 0) {
      try {
        const result = await spendPoints(user.id, cost, `리딩 이용 (${spreadType}${hasPartner ? ', 궁합' : ''})`);
        spent = { userId: user.id, cost, transactionId: result.transactionId };
        pointsAfter = result.balance;
      } catch (e) {
        if (e instanceof InsufficientPointsError) {
          res.status(402).json({
            error: `포인트가 부족해요. 이 리딩은 ${e.required.toLocaleString('ko-KR')}P가 필요합니다.`,
            code: 'INSUFFICIENT_POINTS',
            required: e.required,
            balance: e.balance
          });
          return;
        }
        throw e;
      }
    }

    // 최근 리딩 내역 조회 (리딩 흐름 연결용)
    // 오늘의 운세는 고민 흐름이 없고 매일 쌓이면 실제 고민 리딩을 밀어내므로 제외
    const recentReadings = await prisma.reading.findMany({
      where: { userId: user.id, spreadType: { not: 'daily-fortune' } },
      orderBy: { createdAt: 'desc' },
      take: 3, // 최근 3개만
      select: {
        question: true,
        spreadType: true,
        createdAt: true,
        interpretation: true,
        drawnCards: true,
        easyReading: true
      }
    });

    // 컨텍스트 생성 (질문 + 그때 카드 + 한 줄 결론 + 요약)
    const previousContext = recentReadings.length > 0 ? recentReadings.map(toPreviousReading) : null;

    // 사용자가 선택한 카드로 뽑기 (역방향 정보 포함)
    const drawnCards = tarotService.drawCards(
      spreadType,
      promptQuestion,
      includeAdviceCard || false,
      selectedCards || cardPositions,
      customPositions?.map(p => p.label)
    );

    // 사주 분석 정보 (클라이언트에서 전달받은 것 우선, 없으면 DB에서)
    let sajuData = clientSajuAnalysis || user.sajuAnalysis;
    
    // sal 또는 zodiac 필드가 없는 기존 데이터면 재계산
    // (2026-02-15 살 분석 ~ 2026-03-16 별자리 추가 사이 저장분은 sal만 있고 zodiac이 없다)
    if (sajuData && (!(sajuData as any).sal || !(sajuData as any).zodiac) && user.birthInfo) {
      try {
        const { SajuService } = require('../services/saju.service');
        const sajuSvc = new SajuService();
        sajuData = sajuSvc.analyzeSaju(user.birthInfo as any);
        // DB도 업데이트 (비동기, 응답 대기 안 함)
        prisma.user.update({
          where: { id: user.id },
          data: { sajuAnalysis: sajuData as any }
        }).catch((e: any) => console.error('사주 DB 업데이트 실패:', e));
      } catch (e) {
        console.error('리딩 시 사주 재계산 오류:', e);
      }
    }

    // 상대방 사주 분석 (partnerBirthInfo가 있는 경우)
    let partnerSajuData: any = null;
    if (hasPartner) {
      try {
        const { SajuService } = require('../services/saju.service');
        const sajuSvc = new SajuService();
        partnerSajuData = sajuSvc.analyzeSaju(partnerBirthInfo);
        console.log('✅ 상대방 사주 분석 완료:', partnerSajuData.dayMaster, partnerSajuData.dayMasterElement);
      } catch (e) {
        console.error('상대방 사주 분석 오류:', e instanceof Error ? e.message : e);
        // 궁합 요금을 받고 궁합 없는 리딩을 내보내지 않는다 — 아래 catch가 포인트를 돌려준다
        throw new PartnerInfoError();
      }
    }

    // AI 기반 종합 해석 (사주 정보 + 타로 카드 복합 해석)
    const aiInterpretation = await aiService.generateAdvancedInterpretation(
      sajuData as any,
      drawnCards,
      spreadType,
      promptQuestion,
      previousContext,
      user.name || undefined,
      includeAdviceCard || false,
      user.mbti || undefined,
      partnerSajuData,
      partnerMbti || undefined,
      customPositions || undefined
    );

    // 리딩 결과 저장
    const reading = await prisma.reading.create({
      data: {
        userId: user.id,
        question,
        spreadType,
        drawnCards: drawnCards as any,
        interpretation: aiInterpretation.interpretation,
        elementalHarmony: aiInterpretation.elementalHarmony,
        personalizedAdvice: aiInterpretation.personalizedAdvice,
        adviceCardInterpretation: aiInterpretation.adviceCardInterpretation,
        compatibilityReading: aiInterpretation.compatibilityReading || null,
        ...(aiInterpretation.easyReading ? { easyReading: aiInterpretation.easyReading as any } : {}),
        aiProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'claude'
      }
    });

    // 여기까지 왔으면 리딩이 저장된 것 — 이후 오류로 환불되지 않게 차감 상태를 비운다
    freeClaim = null;
    if (spent) {
      const { transactionId } = spent;
      spent = null;
      linkSpendToReading(transactionId, reading.id).catch((e: unknown) =>
        console.error('포인트 내역-리딩 연결 실패:', e instanceof Error ? e.message : e)
      );
    }

    res.json({
      success: true,
      data: {
        readingId: reading.id,
        pointsCharged: cost,
        points: pointsAfter,
        sajuAnalysis: user.sajuAnalysis,
        drawnCards,
        spreadType,
        question,
        ...aiInterpretation,
        ...(partnerSajuData ? { partnerSajuAnalysis: partnerSajuData } : {})
      }
    });
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    let refunded = false;
    if (freeClaim) {
      await releaseDailyFree(freeClaim.userId, freeClaim.spreadType).catch((e: unknown) =>
        console.error('무료 리딩 기록 되돌리기 실패:', e instanceof Error ? e.message : e)
      );
    }
    if (spent) {
      try {
        await refundSpend(spent.userId, spent.cost, '리딩 실패로 포인트 환불');
        refunded = true;
      } catch (refundError) {
        console.error(`리딩 실패 후 포인트 환불 실패 — 수동 환불 필요: userId=${spent.userId}, cost=${spent.cost}`, refundError instanceof Error ? refundError.message : refundError);
      }
    }
    if (res.headersSent) return;
    if (error instanceof PartnerInfoError) {
      res.status(400).json({
        error: refunded
          ? '상대방 생년월일을 다시 확인해 주세요. 차감된 포인트는 돌려드렸어요.'
          : '상대방 생년월일을 다시 확인해 주세요.'
      });
      return;
    }
    res.status(500).json({
      error: refunded
        ? 'AI 해석 생성 중 오류가 발생했습니다. 차감된 포인트는 돌려드렸어요.'
        : 'AI 해석 생성 중 오류가 발생했습니다.'
    });
  }
};

// 내 리딩 히스토리 조회
export const getMyReadings = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [readings, total] = await Promise.all([
      prisma.reading.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.reading.count({
        where: { userId: req.user.userId }
      })
    ]);

    res.json({
      success: true,
      data: {
        readings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('리딩 히스토리 조회 오류:', error);
    res.status(500).json({ error: '리딩 히스토리 조회 중 오류가 발생했습니다.' });
  }
};

// 특정 리딩 상세 조회
export const getReadingById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { id } = req.params;

    const reading = await prisma.reading.findFirst({
      where: {
        id,
        userId: req.user.userId
      }
    });

    if (!reading) {
      res.status(404).json({ error: '리딩을 찾을 수 없습니다.' });
      return;
    }

    // IntegratedReading 형식으로 반환 (화면 복귀 복구용)
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { sajuAnalysis: true }
    });

    res.json({
      success: true,
      data: {
        readingId: reading.id,
        sajuAnalysis: user?.sajuAnalysis || null,
        drawnCards: reading.drawnCards,
        spreadType: reading.spreadType,
        question: reading.question,
        interpretation: reading.interpretation,
        elementalHarmony: reading.elementalHarmony,
        personalizedAdvice: reading.personalizedAdvice,
        adviceCardInterpretation: reading.adviceCardInterpretation,
        compatibilityReading: reading.compatibilityReading,
        easyReading: reading.easyReading ?? undefined,
      }
    });
  } catch (error) {
    console.error('리딩 조회 오류:', error);
    res.status(500).json({ error: '리딩 조회 중 오류가 발생했습니다.' });
  }
};
