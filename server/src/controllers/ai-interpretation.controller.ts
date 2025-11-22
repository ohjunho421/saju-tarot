import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { TarotService } from '../services/tarot.service';
import aiService from '../services/ai.service';
import type { SpreadType } from '../models/tarot.model';

const tarotService = new TarotService();

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

// AI 기반 통합 해석
export const getAIIntegratedReading = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { question, spreadType, includeAdviceCard, cardPositions }: {
      question: string;
      spreadType: SpreadType;
      includeAdviceCard?: boolean;
      cardPositions?: number[];
    } = req.body;

    if (!question || !spreadType) {
      res.status(400).json({ error: '질문과 스프레드 타입을 입력해주세요.' });
      return;
    }
    
    if (!cardPositions || cardPositions.length === 0) {
      res.status(400).json({ error: '카드를 선택해주세요.' });
      return;
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });
    
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    // 최근 리딩 내역 조회 (컨텍스트용)
    const recentReadings = await prisma.reading.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 3, // 최근 3개만
      select: {
        question: true,
        spreadType: true,
        createdAt: true,
        interpretation: true
      }
    });

    // 컨텍스트 생성
    const previousContext = recentReadings.length > 0 ? recentReadings.map(r => ({
      date: r.createdAt.toISOString().split('T')[0],
      question: r.question,
      summary: r.interpretation.substring(0, 150) + '...'
    })) : null;

    // 사용자가 선택한 카드로 뽑기
    const drawnCards = tarotService.drawCards(spreadType, question, includeAdviceCard || false, cardPositions);

    // AI 기반 종합 해석 (이전 컨텍스트 포함)
    const aiInterpretation = await aiService.generateAdvancedInterpretation(
      user.sajuAnalysis as any,
      drawnCards,
      spreadType,
      question,
      previousContext,
      user.name || undefined
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
        aiProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'claude'
      }
    });

    res.json({
      success: true,
      data: {
        readingId: reading.id,
        sajuAnalysis: user.sajuAnalysis,
        drawnCards,
        spreadType,
        question,
        ...aiInterpretation
      }
    });
  } catch (error) {
    console.error('AI 해석 생성 오류:', error);
    res.status(500).json({ error: 'AI 해석 생성 중 오류가 발생했습니다.' });
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

    res.json({
      success: true,
      data: reading
    });
  } catch (error) {
    console.error('리딩 조회 오류:', error);
    res.status(500).json({ error: '리딩 조회 중 오류가 발생했습니다.' });
  }
};
