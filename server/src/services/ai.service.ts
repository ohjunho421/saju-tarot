import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import type { SajuAnalysis } from '../models/saju.model';
import type { DrawnCard, SpreadType } from '../models/tarot.model';
import { DateHelper } from '../utils/date-helper';
import { ZodiacService } from './zodiac.service';

export class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private claude: Anthropic | null = null;
  private geminiModels = ['gemini-2.5-flash', 'gemini-2.5-pro'];

  constructor() {
    console.log('🔍 AI 서비스 초기화 중...');
    console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ 있음' : '❌ 없음');
    console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? '✅ 있음' : '❌ 없음');
    console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ 있음' : '❌ 없음');
    
    // Gemini 초기화
    if (process.env.GEMINI_API_KEY) {
      try {
        this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini API 초기화 완료');
      } catch (error) {
        console.error('❌ Gemini API 초기화 실패:', error);
      }
    }

    // Claude 초기화 (ANTHROPIC_API_KEY도 체크)
    const claudeKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (claudeKey) {
      try {
        this.claude = new Anthropic({
          apiKey: claudeKey
        });
        console.log('✅ Claude API 초기화 완료');
      } catch (error) {
        console.error('❌ Claude API 초기화 실패:', error);
      }
    }
    
    if (!this.gemini && !this.claude) {
      console.warn('⚠️ AI API가 초기화되지 않았습니다. 환경변수를 확인하세요.');
    }
  }

  // 질문 분석 및 스프레드 추천
  async analyzeQuestionAndRecommendSpread(question: string): Promise<{
    analysis: string;
    recommendedSpread: SpreadType;
    reason: string;
  }> {
    const prompt = `
당신은 수십 년 경력의 타로 마스터입니다.
사용자의 질문을 깊이 읽고, **그 사람이 진짜 알고 싶어하는 본질**이 무엇인지 파악하세요.

사용자의 질문: "${question}"

## 핵심 판단 기준: 사용자가 원하는 답의 형태

질문을 분석할 때 **사용자가 원하는 답의 형태**를 먼저 파악하세요:

1. **"언제?" (시기/타이밍)** → **six-months**
   - 사용자가 "언제쯤", "몇 월에", "시기가" 등을 물으면 **시간의 흐름**을 봐야 답할 수 있음
   - 월별 에너지 변화를 통해 적절한 시기를 찾아줌

2. **"어떤 것?" (선택/비교)** → **two-card** 또는 **three-card**
   - A vs B 명확한 비교 → two-card
   - 선택의 결과/흐름까지 보고 싶으면 → three-card

3. **"왜?" (원인/해결)** → **problem-solution**
   - 현재 상황의 원인과 해결책을 찾고 싶을 때

4. **"어떻게?" (방법/조언)** → **three-card** 또는 **celtic-cross**
   - 상황이 단순하면 three-card, 복잡하면 celtic-cross

5. **"예/아니오?"** → **yes-no** 또는 **one-card**
   - 단순 확인 질문

## 실제 예시 (이 패턴을 참고하세요)

| 질문 | 본질적 의도 | 추천 |
|------|------------|------|
| "남자친구와 헤어질까요?" | 결정의 결과가 궁금함 | three-card |
| "취업은 언제쯤 될까요?" | **시기**를 알고 싶음 | **six-months** |
| "A회사 vs B회사?" | 둘을 비교하고 싶음 | two-card |
| "왜 자꾸 실패할까요?" | 원인을 알고 싶음 | problem-solution |
| "이직해도 될까요?" | 결정에 대한 조언 | three-card |
| "올해 재물운은?" | 장기적 흐름 | six-months |
| "그 사람이 날 좋아할까?" | 예/아니오 | yes-no |
| "오늘 중요한 미팅인데?" | 오늘의 에너지 | one-card |
| "연애가 언제 시작될까?" | **시기**를 알고 싶음 | **six-months** |
| "이 프로젝트 성공할까?" | 결과 예측 | three-card |
| "결혼은 언제쯤?" | **시기**를 알고 싶음 | **six-months** |
| "이번달 연애운은?" | 이번 달 특정 운세 | **three-card** |
| "이번달 금전운 봐줘" | 이번 달 특정 운세 | **three-card** |
| "올해 연애운은?" | 올해 장기 흐름 | **six-months** |
| "오늘의 운세" | 오늘 하루 전체 운세 | **daily-fortune** |

## 스프레드 설명

- **one-card**: 지금 이 순간의 핵심 메시지
- **yes-no**: 직관적 예/아니오
- **two-card**: A와 B 직접 비교
- **problem-solution**: 문제의 원인 + 해결책
- **three-card**: 과거-현재-미래 흐름
- **saju-custom**: 오행 에너지 분석
- **six-months**: 향후 6개월 월별 흐름 (**시기 질문에 필수**, "올해 연애운" 등 연간 운세에도 사용)
- **celtic-cross**: 복잡한 상황 종합 분석
- **compatibility**: 두 사람의 궁합 분석 (**궁합, 잘 맞는지, 우리 사이, 상대방과 등 관계 질문에 필수**)
- **daily-fortune**: 오늘 하루의 총운/금전운/연애운 (**"오늘의 운세"처럼 오늘 하루만 볼 때만 사용**)

⚠️ 기간별 운세 구분 (매우 중요):
- "오늘 운세/연애운" → **daily-fortune** (오늘 하루만)
- "이번달 연애운/금전운" → **three-card** (이번 달의 흐름)
- "이번주 운세" → **three-card** (이번 주의 흐름)
- "올해 연애운/금전운" → **six-months** (올해 장기 흐름)

JSON 형식으로 답변:
{
  "analysis": "사용자가 진짜 알고 싶은 것 (시기? 비교? 결과? 원인?)",
  "recommendedSpread": "스프레드 타입",
  "reason": "왜 이 스프레드가 적합한지 (사용자가 원하는 답의 형태와 연결)"
}
`;

    try {
      let response: string = '';

      // Claude 먼저 사용 (더 안정적인 JSON 응답)
      if (this.claude) {
        console.log('🤖 Claude로 스프레드 추천...');
        const message = await this.claude.messages.create({
          // Claude 4.5 모델 (2025년 최신) - 코딩 우수성, 에이전트 기능, 창의적 콘텐츠 생성에 최적화
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        });
        response = message.content[0].type === 'text' ? message.content[0].text : '';
      } else if (this.gemini) {
        // Claude 없으면 Gemini 사용
        response = await this.tryGeminiWithFallback(prompt, 1024);
      }

      // JSON 파싱
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('✅ AI 스프레드 추천 결과:', parsed.recommendedSpread);
        return parsed;
      }

      console.warn('⚠️ AI 응답에서 JSON 파싱 실패, fallback 사용');
      return this.fallbackSpreadRecommendation(question);
    } catch (error) {
      console.error('AI 스프레드 추천 오류:', error);
      return this.fallbackSpreadRecommendation(question);
    }
  }

  // Fallback 추천 로직
  private fallbackSpreadRecommendation(question: string): {
    analysis: string;
    recommendedSpread: SpreadType;
    reason: string;
  } {
    const lowerQ = question.toLowerCase();

    // 0-1. 궁합 관련 질문 (compatibility) - 최우선 체크
    const compatibilityKeywords = ['궁합', '잘 맞', '잘맞', '어울리', '맞는지', '우리 사이', '우리사이', '그 사람과', '이 사람과', '상대방과', '연인과', '남친과', '여친과', '남자친구와', '여자친구와', '배우자와', '우리 둘'];
    const isCompatibilityQuestion = compatibilityKeywords.some(keyword => lowerQ.includes(keyword));

    if (isCompatibilityQuestion) {
      return {
        analysis: '두 사람의 관계와 궁합을 알고 싶은 질문입니다.',
        recommendedSpread: 'compatibility',
        reason: '두 사람의 에너지를 각각 살펴보고, 관계의 흐름과 앞으로의 방향을 함께 분석하는 궁합 리딩을 추천합니다.'
      };
    }

    // 0. "언제" 시기 질문 (six-months) - 최우선 체크
    const timingQuestionKeywords = ['언제', '몇월', '몇 월', '몇달', '몇 달', '시기', '때가'];
    const isTimingQuestion = timingQuestionKeywords.some(keyword => lowerQ.includes(keyword));
    
    if (isTimingQuestion) {
      return {
        analysis: '시기를 알고 싶은 질문입니다.',
        recommendedSpread: 'six-months',
        reason: '"언제"에 대한 답을 얻으려면 시간의 흐름을 봐야 해요. 향후 6개월간 월별 흐름을 통해 적절한 시기를 파악할 수 있습니다.'
      };
    }

    // 1. 명확한 A vs B 비교 질문 (two-card)
    const vsKeywords = ['vs', ' 아니면 ', '중에서', '중에 뭐', '둘 중', '둘중'];
    const hasClearComparison = vsKeywords.some(keyword => lowerQ.includes(keyword));
    
    if (hasClearComparison) {
      return {
        analysis: '두 가지 선택지를 직접 비교하는 질문입니다.',
        recommendedSpread: 'two-card',
        reason: '각 선택지를 대표하는 카드 두 장으로 직접 비교해보세요.'
      };
    }

    // 2. 문제/해결 구조의 질문
    const problemKeywords = ['왜 이런', '문제가', '해결', '어떻게 하면', '방법'];
    const isProblemSolution = problemKeywords.some(keyword => lowerQ.includes(keyword));
    
    if (isProblemSolution) {
      return {
        analysis: '현재 문제의 원인과 해결책을 찾는 질문입니다.',
        recommendedSpread: 'problem-solution',
        reason: '문제의 원인과 해결책을 각각 카드로 확인할 수 있습니다.'
      };
    }

    // 3. 선택/결정 질문 (three-card 또는 two-card)
    const choiceKeywords = [
      '어느', '어떤', '뭐가', '무엇이', '선택', '결정', '해야 할까', '해야할까',
      '더 좋', '더좋', '낫', '할까 말까', '할까말까', '시작해도', 
      '해도 될까', '해도될까', '맞을까', '좋을까', '괜찮을까', '어떨까'
    ];
    
    const isChoiceQuestion = choiceKeywords.some(keyword => lowerQ.includes(keyword));
    
    if (isChoiceQuestion) {
      // "A와 B 중에" 패턴이 있으면 two-card
      if (lowerQ.includes('중에') || lowerQ.includes('중') && lowerQ.includes('가')) {
        return {
          analysis: '선택지 비교가 필요한 질문입니다.',
          recommendedSpread: 'two-card',
          reason: '두 가지 옵션을 직접 비교하는 투 카드 스프레드를 추천합니다.'
        };
      }
      return {
        analysis: '결정에 도움이 필요한 질문입니다.',
        recommendedSpread: 'three-card',
        reason: '상황의 흐름과 결과를 보기 위해 쓰리 카드 스프레드를 추천합니다.'
      };
    }

    // 4. 간단한 예/아니오 질문
    const yesNoPatterns = ['할 수 있을까', '할수있을까', '가능할까', '될까요'];
    const isYesNo = yesNoPatterns.some(p => lowerQ.includes(p)) && lowerQ.length < 25;
    
    if (isYesNo) {
      return {
        analysis: '직관적인 답이 필요한 질문입니다.',
        recommendedSpread: 'yes-no',
        reason: '예/아니오 형태의 명확한 답을 얻을 수 있습니다.'
      };
    }

    // 5-1. 운세 질문 (기간별 분기)
    const fortuneTopics = ['운세', '총운', '금전운', '연애운', '건강운', '직장운', '학업운', '사업운'];
    const isFortuneQuestion = fortuneTopics.some(keyword => lowerQ.includes(keyword));

    if (isFortuneQuestion) {
      // 기간 키워드에 따라 적절한 스프레드 선택
      const monthlyKeywords = ['이번 달', '이번달', '이달', '금월', '월간'];
      const yearlyKeywords = ['올해', '금년', '이번 해', '연간', '내년'];
      const weeklyKeywords = ['이번 주', '이번주', '금주', '주간'];
      const dailyKeywords = ['오늘', '오늘의', '일일', '하루'];

      const isMonthly = monthlyKeywords.some(k => lowerQ.includes(k));
      const isYearly = yearlyKeywords.some(k => lowerQ.includes(k));
      const isWeekly = weeklyKeywords.some(k => lowerQ.includes(k));
      const isDaily = dailyKeywords.some(k => lowerQ.includes(k));

      if (isYearly) {
        return {
          analysis: '올해의 운세 흐름을 묻는 질문입니다.',
          recommendedSpread: 'six-months',
          reason: '향후 6개월간 월별 흐름을 통해 올해의 운세를 종합적으로 파악할 수 있습니다.'
        };
      }
      if (isMonthly) {
        return {
          analysis: '이번 달의 운세를 묻는 질문입니다.',
          recommendedSpread: 'three-card',
          reason: '이번 달의 흐름을 과거-현재-미래로 나눠 구체적으로 살펴봅니다.'
        };
      }
      if (isWeekly) {
        return {
          analysis: '이번 주의 운세를 묻는 질문입니다.',
          recommendedSpread: 'three-card',
          reason: '이번 주의 흐름을 과거-현재-미래로 나눠 살펴봅니다.'
        };
      }
      // 기간 미지정 또는 오늘 → daily-fortune
      return {
        analysis: '오늘의 운세를 묻는 질문입니다.',
        recommendedSpread: 'daily-fortune',
        reason: '총운, 금전운, 연애운을 사주와 절기에 맞춰 해석합니다.'
      };
    }

    // 5-2. 간단한 현재 상황 질문
    if (lowerQ.includes('오늘') || lowerQ.includes('지금') || lowerQ.length < 10) {
      return {
        analysis: '간단한 질문입니다.',
        recommendedSpread: 'one-card',
        reason: '지금 이 순간의 핵심 메시지를 전달합니다.'
      };
    }

    // 6. 시기/흐름 관련 질문
    const timingKeywords = ['개월', '하반기', '상반기', '올해', '내년', '흐름'];
    const pureTimingQuestion = timingKeywords.some(keyword => lowerQ.includes(keyword));
    
    if (pureTimingQuestion) {
      return {
        analysis: '시기와 흐름을 묻는 질문입니다.',
        recommendedSpread: 'six-months',
        reason: '향후 6개월간의 월별 흐름을 볼 수 있습니다.'
      };
    }

    // 7. 과거/현재/미래 흐름
    if (lowerQ.includes('과거') || lowerQ.includes('현재') || lowerQ.includes('미래')) {
      return {
        analysis: '시간의 흐름을 보는 질문입니다.',
        recommendedSpread: 'three-card',
        reason: '과거-현재-미래의 흐름을 볼 수 있습니다.'
      };
    }

    // 8. 오행/사주 관련
    if (lowerQ.includes('재물') || lowerQ.includes('건강') || lowerQ.includes('오행') || lowerQ.includes('사주')) {
      return {
        analysis: '오행과 연관된 질문입니다.',
        recommendedSpread: 'saju-custom',
        reason: '사주의 오행 균형과 연결된 스프레드입니다.'
      };
    }

    // 9. 관계나 복잡한 상황
    if (lowerQ.includes('관계') || lowerQ.includes('복잡') || lowerQ.length > 40) {
      return {
        analysis: '복합적인 상황 분석이 필요한 질문입니다.',
        recommendedSpread: 'celtic-cross',
        reason: '다양한 측면에서 종합적으로 분석합니다.'
      };
    }

    // 10. 기본값: 쓰리 카드 (가장 범용적)
    return {
      analysis: '상황의 흐름을 파악하는 질문입니다.',
      recommendedSpread: 'three-card',
      reason: '과거-현재-미래의 흐름을 통해 상황을 이해합니다.'
    };
  }

  // AI 기반 종합 해석 (에이전틱 2단계 파이프라인)
  async generateAdvancedInterpretation(
    sajuAnalysis: SajuAnalysis,
    drawnCards: DrawnCard[],
    spreadType: SpreadType,
    question: string,
    previousContext?: Array<{ date: string; question: string; summary: string }> | null,
    userName?: string,
    includeAdviceCard: boolean = false,
    userMbti?: string | null,
    partnerSajuAnalysis?: SajuAnalysis | null,
    partnerMbti?: string
  ): Promise<{
    interpretation: string;
    elementalHarmony: string;
    personalizedAdvice: string;
    adviceCardInterpretation?: string;
    compatibilityReading?: string;
  }> {
    const dateContext = DateHelper.getCurrentDateContext();
    const seasonalElement = DateHelper.getSeasonalElement(dateContext.season);
    const salList = (sajuAnalysis as any).sal as Array<{ name: string; description: string; effect: string; isPositive: boolean; location?: string }> | undefined;

    console.log('🚀 에이전틱 파이프라인 시작 - Step 1: 컨텍스트 분석');

    // ============ Step 1: AI가 컨텍스트를 분석하여 해석 계획 수립 ============
    const analysisContext = await this.analyzeContext({
      sajuAnalysis,
      drawnCards,
      spreadType,
      question,
      userName,
      userMbti,
      salList: salList || undefined,
      previousContext,
      dateContext,
      seasonalElement,
      partnerSajuAnalysis: partnerSajuAnalysis || undefined,
      partnerMbti
    });

    console.log('🚀 에이전틱 파이프라인 - Step 2: 분석 계획 기반 해석 생성');

    // ============ Step 2: 분석 계획을 기반으로 구조화된 해석 생성 ============
    try {
      const result = await this.generateReading({
        analysisContext,
        sajuAnalysis,
        drawnCards,
        spreadType,
        question,
        userName,
        userMbti,
        salList: salList || undefined,
        previousContext,
        dateContext,
        seasonalElement,
        includeAdviceCard,
        partnerSajuAnalysis: partnerSajuAnalysis || undefined,
        partnerMbti
      });

      console.log('✅ 에이전틱 파이프라인 완료');
      return result;
    } catch (step2Error) {
      console.error('❌ Step 2 실패, 레거시 단일 프롬프트로 fallback:', step2Error);
      return this.legacyGenerateInterpretation({
        sajuAnalysis,
        drawnCards,
        spreadType,
        question,
        previousContext,
        userName,
        includeAdviceCard,
        userMbti,
        salList,
        dateContext,
        seasonalElement,
        partnerSajuAnalysis: partnerSajuAnalysis || undefined
      });
    }
  }

  // 레거시 단일 프롬프트 방식 (에이전틱 파이프라인 실패 시 fallback)
  private async legacyGenerateInterpretation(params: {
    sajuAnalysis: SajuAnalysis;
    drawnCards: DrawnCard[];
    spreadType: SpreadType;
    question: string;
    previousContext?: Array<{ date: string; question: string; summary: string }> | null;
    userName?: string;
    includeAdviceCard: boolean;
    userMbti?: string | null;
    salList?: Array<{ name: string; description: string; effect: string; isPositive: boolean }>;
    dateContext: { month: number; season: string; jieqi: string };
    seasonalElement: string;
    partnerSajuAnalysis?: SajuAnalysis;
  }): Promise<{
    interpretation: string;
    elementalHarmony: string;
    personalizedAdvice: string;
    adviceCardInterpretation?: string;
  }> {
    const { sajuAnalysis, drawnCards, spreadType, question, previousContext, userName, includeAdviceCard, userMbti, salList, dateContext, seasonalElement } = params;
    const userElement = sajuAnalysis.dayMasterElement;
    const elementDescriptions: Record<string, string> = {
      '목': '나무처럼 성장하고 뻗어나가는',
      '화': '불처럼 열정적이고 활동적인',
      '토': '흙처럼 안정적이고 포용력 있는',
      '금': '금속처럼 단단하고 원칙을 중시하는',
      '수': '물처럼 유연하고 지혜로운'
    };
    const elementNature = elementDescriptions[userElement] || '';
    const mainCards = drawnCards.filter(dc => dc.positionMeaning !== '조언 카드');
    const adviceCard = drawnCards.find(dc => dc.positionMeaning === '조언 카드');

    let salSection = '';
    if (salList && salList.length > 0) {
      salSection = `\n[신살] ${salList.map(s => `${s.name}(${s.isPositive ? '길' : '흉'}): ${s.effect}`).join(' / ')}`;
    }

    // 별자리 정보
    const zodiacInfo = (sajuAnalysis as any).zodiac;
    const zodiacSection = zodiacInfo
      ? `\n[별자리] ${zodiacInfo.symbol} ${zodiacInfo.sign}(${zodiacInfo.signEnglish}) - ${zodiacInfo.element} 원소, ${zodiacInfo.quality}\n성격: ${zodiacInfo.personality}\n강점: ${zodiacInfo.strengths.join(', ')} / 약점: ${zodiacInfo.weaknesses.join(', ')}`
      : '';

    const prompt = `동양 철학과 서양 별자리, 그리고 타로를 융합한 전문 상담사로서 해석해주세요.

[사용자] ${userName ? userName + '님, ' : ''}일간 ${sajuAnalysis.dayMaster}(${userElement}) - ${elementNature} 성향
강한 오행: ${sajuAnalysis.strongElements.join(', ')} / 약한 오행: ${sajuAnalysis.weakElements.join(', ')}
${userMbti ? `MBTI: ${userMbti}` : ''}${salSection}${zodiacSection}

[질문] "${question}"

[카드 - ${spreadType}]
${mainCards.map((dc, i) => `${i + 1}. ${dc.positionMeaning}: ${dc.card.nameKo}(${dc.isReversed ? '역' : '정'}) - ${dc.isReversed ? dc.card.reversedMeaning : dc.card.uprightMeaning}`).join('\n')}
${adviceCard ? `조언: ${adviceCard.card.nameKo}(${adviceCard.isReversed ? '역' : '정'})` : ''}

아래 JSON으로만 응답하세요. 마크다운 금지. ${userName ? `"${userName}님" 호칭.` : ''} 역방향 카드는 역방향 의미로만 해석. 솔직하게.
가독성: 문단 사이에 줄바꿈(\\n\\n)을 넣고, 한 문단은 2~3문장까지만.
카드 해석: (1) 카드 그림/상징 묘사 먼저 (2) 질문과의 연결 (3) 사주 연결은 자연스러울 때만.

{
  "summary": "인사 + 줄바꿈 + 핵심 결론 + 이유 (250~300자)",
  "cardReadings": "각 카드: 그림/상징 묘사 → 질문 연결 → 사주 연결(선택). 카드당 300~400자. 카드 사이 줄바꿈(\\n\\n)",
  "elementalHarmony": "${dateContext.season}(${seasonalElement})과 ${userElement} 기운의 조화를 자연 비유로 (250자)",
  "practiceAdvice": "카드별 실천 방법을 줄바꿈으로 구분 + 오행 활용/보완법 (350자)"${includeAdviceCard && adviceCard ? `,
  "adviceCardReading": "조언 카드 그림/상징 설명 + 실천 조언 (250자)"` : ''}
}`;

    let response = '';
    const cardCount = drawnCards.length;
    let maxTokens = cardCount >= 6 ? 10000 : cardCount >= 4 ? 7000 : 5000;
    if (includeAdviceCard) maxTokens += 1000;

    if (this.gemini) {
      try {
        response = await this.tryGeminiWithFallback(prompt, maxTokens);
      } catch (geminiError) {
        console.warn('⚠️ [Legacy] Gemini 실패, Claude fallback:', (geminiError as Error).message);
      }
    }
    if (!response && this.claude) {
      const message = await this.claude.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }]
      });
      response = message.content[0].type === 'text' ? message.content[0].text : '';
    }
    if (!response) {
      throw new Error('AI 서비스를 사용할 수 없습니다.');
    }

    console.log(`📊 [Legacy] 카드 ${cardCount}장, 응답 길이: ${response.length}자`);

    // JSON 파싱 시도 (제어문자 정리 후)
    const sanitizedLegacy = this.sanitizeJsonResponse(response);
    const jsonMatch = sanitizedLegacy.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const interpretation = parsed.summary && parsed.cardReadings
          ? `${parsed.summary}\n\n===CARD_DETAILS===\n\n${parsed.cardReadings}`
          : parsed.summary || parsed.cardReadings || response.substring(0, 500);
        
        return {
          interpretation,
          elementalHarmony: parsed.elementalHarmony || '오행의 흐름을 분석하고 있어요.',
          personalizedAdvice: parsed.practiceAdvice || '실천 가능한 조언을 준비하고 있어요.',
          ...(parsed.adviceCardReading ? { adviceCardInterpretation: parsed.adviceCardReading } : {})
        };
      } catch (e) {
        console.warn('Legacy JSON 파싱 실패, regex fallback');
      }
    }

    // 최종 fallback: 텍스트 기반 파싱
    return this.parseAIResponse(response);
  }

  // ============================================================
  // 에이전틱 파이프라인: Step 1 - 컨텍스트 분석
  // AI가 질문+사주+신살+카드를 분석하여 해석 계획을 수립
  // ============================================================
  private async analyzeContext(params: {
    sajuAnalysis: SajuAnalysis;
    drawnCards: DrawnCard[];
    spreadType: SpreadType;
    question: string;
    userName?: string;
    userMbti?: string | null;
    salList?: Array<{ name: string; description: string; effect: string; isPositive: boolean; location?: string }>;
    previousContext?: Array<{ date: string; question: string; summary: string }> | null;
    dateContext: { month: number; season: string; jieqi: string };
    seasonalElement: string;
    partnerSajuAnalysis?: SajuAnalysis;
    partnerMbti?: string;
  }): Promise<{
    keySals: Array<{ name: string; reason: string; isPositive: boolean }>;
    elementInterplay: string;
    readingTone: string;
    cardConnections: Array<{ card: string; symbolism: string; sajuLink: string; salLink: string }>;
    overallDirection: string;
    mbtiInsight: string;
    compatibilityInsight?: string;
  }> {
    const { sajuAnalysis, drawnCards, spreadType, question, userName, userMbti, salList, previousContext, dateContext, seasonalElement, partnerSajuAnalysis, partnerMbti } = params;

    // 궁합 분석 섹션 (상대방 정보가 있을 때)
    const partnerSection = partnerSajuAnalysis ? `
[상대방 사주]
일간: ${partnerSajuAnalysis.dayMaster}(${partnerSajuAnalysis.dayMasterElement})
강한 오행: ${partnerSajuAnalysis.strongElements.join(', ')}
약한 오행: ${partnerSajuAnalysis.weakElements.join(', ')}
신살: ${((partnerSajuAnalysis as any).sal || []).map((s: any) => `${s.name}(${s.isPositive ? '길신' : '흉살'})`).join(', ') || '없음'}
${partnerMbti ? `MBTI: ${partnerMbti}` : ''}

[사전 궁합 분석]
오행 관계: 나(${sajuAnalysis.dayMasterElement}) vs 상대(${partnerSajuAnalysis.dayMasterElement}) - ${this.analyzeElementRelation(sajuAnalysis.dayMasterElement, partnerSajuAnalysis.dayMasterElement)}
일간 합: ${this.analyzeStemRelation(sajuAnalysis.chart.day.heavenlyStem, partnerSajuAnalysis.chart.day.heavenlyStem)}
일지 충: ${this.analyzeBranchConflict(sajuAnalysis.chart.day.earthlyBranch, partnerSajuAnalysis.chart.day.earthlyBranch)}
공통 신살: ${this.analyzeSharedSals((sajuAnalysis as any).sal || [], (partnerSajuAnalysis as any).sal || [])}` : '';

    // 신살 텍스트를 단순 문자열로 (배열 JSON 파싱 오류 방지)
    const salText = salList && salList.length > 0
      ? salList.map(s => `${s.name}(${s.isPositive ? '길신' : '흉살'}):${s.effect}`).join(' | ')
      : '없음';

    // 카드 텍스트를 단순 문자열로 (배열 JSON 파싱 오류 방지)
    const cardText = drawnCards
      .map((dc, i) => `${i + 1}.${dc.positionMeaning}:${dc.card.nameKo}(${dc.isReversed ? '역' : '정'})`)
      .join(' | ');

    // 별자리 정보
    const zodiacInfo = (sajuAnalysis as any).zodiac;
    const zodiacText = zodiacInfo
      ? `별자리: ${zodiacInfo.symbol}${zodiacInfo.sign}(${zodiacInfo.element}원소, ${zodiacInfo.quality}) - ${zodiacInfo.strengths.slice(0, 3).join(',')} / 약점: ${zodiacInfo.weaknesses.slice(0, 2).join(',')}`
      : '';

    const prompt = `당신은 사주명리학, 서양 별자리, 타로를 융합하는 한국어 분석가입니다.
반드시 한국어로 답변하세요. 영어 사용 금지.

[입력 정보]
일간: ${sajuAnalysis.dayMaster}(${sajuAnalysis.dayMasterElement})
강한오행: ${sajuAnalysis.strongElements.join('+')} / 약한오행: ${sajuAnalysis.weakElements.join('+')}
${userMbti ? `MBTI: ${userMbti}` : ''}
${zodiacText}
신살: ${salText}
${partnerSection}
질문: ${question}
카드: ${cardText}
시기: ${dateContext.month}월 ${dateContext.season}

[응답 형식] 아래 JSON 구조를 정확히 따르세요:
{
  "keySalNames": "신살명1,신살명2",
  "keySalReasons": "이유1||이유2",
  "keySalPositive": "true,false",
  "elementInterplay": "오행 상생상극 관계 분석 한 문장",
  "readingTone": "리딩 전체 톤 한 문장",
  "cardSummary": "카드명@@핵심상징@@사주연결##카드명@@핵심상징@@사주연결",
  "overallDirection": "핵심 메시지 방향 한 문장",
  "mbtiInsight": "${userMbti ? `${userMbti} 성격 특성 한 문장` : '해당없음'}"${partnerSajuAnalysis ? `,
  "compatibilityInsight": "두 사람 오행 관계와 궁합 핵심 한 문장"` : ''}
}

규칙:
- 배열 [] 사용 금지, 모든 값은 문자열
- cardSummary: 카드 내부 @@, 카드 간 ##
- keySalReasons: 이유 간 ||
- 신살 없으면 빈 문자열`;

    try {
      let response = '';
      let parsed: any = null;

      // Gemini 시도
      if (this.gemini) {
        try {
          response = await this.tryGeminiWithFallback(prompt, 2048, { jsonMode: true });
          console.log('📋 Step 1 Gemini 응답 (첫 500자):', response.substring(0, 500));
          parsed = this.parseStep1Json(response);
        } catch (geminiError) {
          console.warn('⚠️ Step 1 Gemini 실패:', (geminiError as Error).message);
        }
      }

      // Gemini 실패 or 미설정 → Claude fallback
      if (!parsed && this.claude) {
        try {
          console.log('🔄 Step 1 Claude fallback 시도...');
          const message = await this.claude.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
          });
          response = message.content[0].type === 'text' ? message.content[0].text : '';
          console.log('📋 Step 1 Claude 응답 (첫 500자):', response.substring(0, 500));
          parsed = this.parseStep1Json(response);
        } catch (claudeError) {
          console.warn('⚠️ Step 1 Claude도 실패:', (claudeError as Error).message);
        }
      }

      if (!parsed) throw new Error('Step 1: Gemini와 Claude 모두 실패');

      // 평탄화된 응답을 원래 구조로 변환
      const keySalNames = (parsed.keySalNames || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const keySalReasons = (parsed.keySalReasons || '').split('||').map((s: string) => s.trim());
      const keySalPositive = (parsed.keySalPositive || '').split(',').map((s: string) => s.trim() === 'true');

      const keySals = keySalNames.map((name: string, i: number) => ({
        name,
        reason: keySalReasons[i] || '',
        isPositive: keySalPositive[i] !== undefined ? keySalPositive[i] : true
      }));

      const cardConnections = (parsed.cardSummary || '').split('##')
        .map((part: string) => {
          const segments = part.split('@@');
          return {
            card: segments[0]?.trim() || '',
            symbolism: segments[1]?.trim() || '',
            sajuLink: segments[2]?.trim() || '',
            salLink: ''
          };
        })
        .filter((c: any) => c.card);

      console.log('✅ Step 1 컨텍스트 분석 완료:', {
        keySals: keySals.length,
        tone: parsed.readingTone?.substring(0, 50),
        direction: parsed.overallDirection?.substring(0, 50)
      });

      return {
        keySals,
        elementInterplay: parsed.elementInterplay || '',
        readingTone: parsed.readingTone || '균형 잡힌 해석',
        cardConnections,
        overallDirection: parsed.overallDirection || '현재 상황을 직시하고 균형을 찾으세요',
        mbtiInsight: parsed.mbtiInsight || '해당없음',
        compatibilityInsight: parsed.compatibilityInsight
      };
    } catch (error) {
      console.warn('⚠️ Step 1 분석 실패, 기본 분석 계획 사용:', error);
      // Fallback: 규칙 기반 기본 분석 계획
      const fallbackCompatibility = partnerSajuAnalysis
        ? `나(${sajuAnalysis.dayMasterElement})와 상대(${partnerSajuAnalysis.dayMasterElement})의 오행 관계: ${this.analyzeElementRelation(sajuAnalysis.dayMasterElement, partnerSajuAnalysis.dayMasterElement)}`
        : undefined;

      return {
        keySals: (salList || []).slice(0, 3).map(s => ({
          name: s.name,
          reason: s.effect,
          isPositive: s.isPositive
        })),
        elementInterplay: `${sajuAnalysis.dayMasterElement} 기운이 중심이며, 강한 ${sajuAnalysis.strongElements.join('/')}과 약한 ${sajuAnalysis.weakElements.join('/')}의 균형이 핵심`,
        readingTone: '균형 잡힌 해석',
        cardConnections: drawnCards.slice(0, 3).map(dc => ({
          card: dc.card.nameKo,
          symbolism: dc.card.uprightMeaning,
          sajuLink: `${sajuAnalysis.dayMasterElement} 기운과의 관계`,
          salLink: ''
        })),
        overallDirection: '현재 상황을 직시하고 균형 잡힌 방향을 찾으세요',
        mbtiInsight: userMbti ? `${userMbti} 성격 특성을 고려한 조언` : '해당없음',
        compatibilityInsight: fallbackCompatibility
      };
    }
  }

  // JSON 파싱 헬퍼 - 여러 방법으로 시도
  private parseStep1Json(response: string): any {
    if (!response || response.trim() === '') {
      throw new Error('Step 1 응답이 비어있음');
    }

    console.log('🔍 parseStep1Json 입력 (첫 500자):', response.substring(0, 500));

    // 시도 1: 직접 파싱
    try {
      return JSON.parse(response);
    } catch {}

    // 시도 2: JSON 블록 추출 (가장 외곽 {} 블록)
    let jsonStr = '';
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    } else {
      // 시도 2-1: 불완전 JSON 복구 (열린 { 는 있지만 닫는 } 가 없는 경우)
      const openBraceIdx = response.indexOf('{');
      if (openBraceIdx !== -1) {
        jsonStr = this.repairIncompleteJson(response.substring(openBraceIdx));
        console.log('🔧 불완전 JSON 복구 시도:', jsonStr.substring(0, 300));
      } else {
        console.warn('❌ JSON 블록 없음. 전체 응답:', response.substring(0, 500));
        throw new Error('JSON 블록 없음');
      }
    }

    // 시도 3: 줄바꿈 및 제어문자 정리
    try {
      const cleaned = jsonStr
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s{2,}/g, ' ');
      return JSON.parse(cleaned);
    } catch {}

    // 시도 4: 각 문자열 값 내부에서 이스케이프 안 된 쌍따옴표를 단따옴표로 교체
    try {
      const fixed = jsonStr.replace(/:\s*"((?:[^"\\]|\\.)*)"/g, (_: string, inner: string) => {
        return `: "${inner.replace(/(?<!\\)"/g, '\'')}"`;
      });
      return JSON.parse(fixed.replace(/[\r\n\t]+/g, ' '));
    } catch {}

    // 시도 5: 각 필드를 정규식으로 개별 추출 (최후 수단)
    const result: any = {};
    const fieldPattern = /"(\w+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
    let m;
    while ((m = fieldPattern.exec(jsonStr)) !== null) {
      result[m[1]] = m[2].replace(/[\r\n]/g, ' ').trim();
    }
    const boolPattern = /"(\w+)"\s*:\s*(true|false)/g;
    while ((m = boolPattern.exec(jsonStr)) !== null) {
      result[m[1]] = m[2] === 'true';
    }

    if (Object.keys(result).length === 0) {
      throw new Error('JSON 필드 추출 실패');
    }
    console.log('🔧 regex 추출 결과:', Object.keys(result));
    return result;
  }

  // 불완전 JSON 복구: 잘린 응답에서 닫히지 않은 문자열과 중괄호를 닫아줌
  private repairIncompleteJson(truncated: string): string {
    let str = truncated.trimEnd();

    // 마지막 불완전 key-value 제거: 마지막 완전한 값 뒤의 쓰레기 제거
    // 마지막으로 값이 완전히 끝난 지점(", 또는 "} 등) 찾기
    const lastCompleteValue = str.lastIndexOf('"');
    if (lastCompleteValue > 0) {
      // 그 뒤에 , 또는 공백만 있어야 함
      const afterQuote = str.substring(lastCompleteValue + 1).trim();
      if (afterQuote === '' || afterQuote === ',') {
        // 따옴표가 값의 끝인지 키의 시작인지 판단
        // 뒤에서 두 번째 따옴표까지의 패턴을 확인
        str = str.substring(0, lastCompleteValue + 1);
      } else if (!afterQuote.startsWith('}') && !afterQuote.startsWith(',')) {
        // 값이 잘린 경우: 마지막 완전한 필드까지만 보존
        const lastComma = str.lastIndexOf('",');
        if (lastComma > 0) {
          str = str.substring(0, lastComma + 1); // ","까지 포함
        }
      }
    }

    // 끝에 불필요한 , 제거
    str = str.replace(/,\s*$/, '');

    // 닫는 } 추가
    if (!str.endsWith('}')) {
      // 열려있는 따옴표가 있으면 닫기
      const quoteCount = (str.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        str += '"';
      }
      str += '}';
    }

    return str;
  }

  // ============================================================
  // 에이전틱 파이프라인: Step 2 - 해석 생성
  // Step 1의 분석 계획을 기반으로 구조화된 해석을 생성
  // ============================================================
  private async generateReading(params: {
    analysisContext: {
      keySals: Array<{ name: string; reason: string; isPositive: boolean }>;
      elementInterplay: string;
      readingTone: string;
      cardConnections: Array<{ card: string; symbolism: string; sajuLink: string; salLink: string }>;
      overallDirection: string;
      mbtiInsight: string;
      compatibilityInsight?: string;
    };
    sajuAnalysis: SajuAnalysis;
    drawnCards: DrawnCard[];
    spreadType: SpreadType;
    question: string;
    userName?: string;
    userMbti?: string | null;
    salList?: Array<{ name: string; description: string; effect: string; isPositive: boolean }>;
    previousContext?: Array<{ date: string; question: string; summary: string }> | null;
    dateContext: { month: number; season: string; jieqi: string; solarDate?: string; weekday?: string };
    seasonalElement: string;
    includeAdviceCard: boolean;
    partnerSajuAnalysis?: SajuAnalysis;
    partnerMbti?: string;
  }): Promise<{
    interpretation: string;
    elementalHarmony: string;
    personalizedAdvice: string;
    adviceCardInterpretation?: string;
    compatibilityReading?: string;
  }> {
    const { analysisContext, sajuAnalysis, drawnCards, spreadType, question, userName, userMbti, salList, previousContext, dateContext, seasonalElement, includeAdviceCard, partnerSajuAnalysis, partnerMbti } = params;

    const userElement = sajuAnalysis.dayMasterElement;
    const elementDescriptions: Record<string, string> = {
      '목': '나무처럼 성장하고 뻗어나가는',
      '화': '불처럼 열정적이고 활동적인',
      '토': '흙처럼 안정적이고 포용력 있는',
      '금': '금속처럼 단단하고 원칙을 중시하는',
      '수': '물처럼 유연하고 지혜로운'
    };
    const elementNature = elementDescriptions[userElement] || '';

    // 분석 계획에서 핵심 신살 정보 구성
    const keySalSection = analysisContext.keySals.length > 0
      ? `\n[이 질문에 핵심적인 신살]\n${analysisContext.keySals.map(s => `- ${s.name}(${s.isPositive ? '길신' : '흉살'}): ${s.reason}`).join('\n')}`
      : '';

    // 카드-사주 연결 정보 구성
    const cardConnectionSection = analysisContext.cardConnections.map(c =>
      `- ${c.card}: 상징=${c.symbolism || ''}${c.sajuLink ? `, 사주연결=${c.sajuLink}` : ''}${c.salLink ? `, 신살연결=${c.salLink}` : ''}`
    ).join('\n');

    const adviceCard = drawnCards.find(dc => dc.positionMeaning === '조언 카드');
    const mainCards = drawnCards.filter(dc => dc.positionMeaning !== '조언 카드');

    // 질문에서 선택지 파싱 (A/B/C 선택 질문 감지)
    const parsedChoices = this.parseChoicesFromQuestion(question);
    const isChoiceQuestion = parsedChoices.length >= 2;
    const choiceSection = isChoiceQuestion 
      ? `\n⚠️ 선택지 질문 감지! 사용자가 다음 선택지들을 비교하고 있습니다: ${parsedChoices.map((c: string, i: number) => `[${i+1}] ${c}`).join(', ')}\n각 카드를 해당 선택지와 연결하여 해석하세요. 어떤 선택이 더 유리한지 명확히 조언하세요.`
      : '';

    // 오늘의 운세 특별 프롬프트
    const isDailyFortune = spreadType === 'daily-fortune';
    const dailyFortuneInstruction = isDailyFortune ? `
⚠️ 오늘의 운세 특별 지침 (매우 중요!):
- 이것은 오늘 하루의 운세입니다. 총운/금전운/연애운 3가지를 깊이 있게 해석하세요.
- 반드시 오늘 날짜(${dateContext.solarDate}, ${dateContext.weekday})와 현재 절기(${dateContext.jieqi})를 언급하세요.
- 절기의 기운이 사용자의 사주(일간: ${sajuAnalysis.dayMaster}, ${userElement})와 어떤 영향을 주고받는지 구체적으로 설명하세요.
  예: "오늘은 절기상 ${dateContext.jieqi} 시기로, ${seasonalElement}. 이 기운이 ${userName ? userName + '님의' : '당신의'} ${userElement} 일간과 만나 [상생/상극/비화] 관계를 형성하여 [구체적 영향]이 있어요."
- 12신살 중 오늘과 관련된 신살이 있으면 반드시 언급하세요. 예: "도화살이 있어 오늘 이성과의 만남에서 매력이 배가될 수 있어요."
- ${userMbti ? `MBTI ${userMbti} 성향을 반영하여 조언하세요. 예: "${userMbti} 타입은 오늘 [구체적 상황]에서 [구체적 조언]하면 좋겠어요."` : ''}
- 각 운(총운/금전운/연애운)별로 좋은 점과 주의할 점을 모두 알려주세요.
- 하루의 럭키 아이템, 색상, 방향 등을 하나씩 추천하세요.
` : '';

    // 별자리 정보
    const zodiacInfo = (sajuAnalysis as any).zodiac;
    const zodiacSection = zodiacInfo
      ? `\n[별자리 - 지미두수 연계]\n${zodiacInfo.symbol} ${zodiacInfo.sign}(${zodiacInfo.signEnglish}) - ${zodiacInfo.element} 원소, ${zodiacInfo.quality}\n성격: ${zodiacInfo.personality}\n강점: ${zodiacInfo.strengths.join(', ')} / 약점: ${zodiacInfo.weaknesses.join(', ')}\n동서양 원소 연결: ${ZodiacService.getElementBridge(zodiacInfo.element, userElement)}`
      : '';

    const prompt = `당신은 동양 사주명리학, 서양 별자리(지미두수), 타로를 융합한 전문 상담사입니다.
아래의 "분석 계획"에 따라 해석을 생성하세요. 분석 계획은 사전에 수립된 것이므로 이를 충실히 따르세요.
별자리 정보가 있다면, 사주 분석과 자연스럽게 융합하여 리딩에 반영하세요. 동양의 오행과 서양의 4원소가 어떻게 조화를 이루는지 설명해주세요.

[분석 계획]
해석 방향: ${analysisContext.overallDirection}
전체 톤: ${analysisContext.readingTone}
오행 상호작용: ${analysisContext.elementInterplay}
${analysisContext.mbtiInsight !== '해당없음' ? `MBTI 인사이트: ${analysisContext.mbtiInsight}` : ''}
${keySalSection}
${zodiacSection}

[카드-사주 연결 분석]
${cardConnectionSection}

[사용자 정보]
${userName ? `이름: ${userName}님` : ''}
일간: ${sajuAnalysis.dayMaster}(${userElement}) - ${elementNature} 성향
강한 오행: ${sajuAnalysis.strongElements.join(', ')} / 약한 오행: ${sajuAnalysis.weakElements.join(', ')}
${zodiacInfo ? `별자리: ${zodiacInfo.symbol} ${zodiacInfo.sign}` : ''}
${userMbti ? `MBTI: ${userMbti}` : ''}
${previousContext && previousContext.length > 0 ? `[최근 상담 이력]\n${previousContext.map((ctx, i) => `${i + 1}. "${ctx.question}" (${ctx.date}) - ${ctx.summary}`).join('\n')}` : ''}

[질문] "${question}"
${choiceSection}

[뽑힌 카드 - ${spreadType}]
${mainCards.map((dc, i) => {
  const targetMonth = spreadType === 'six-months' ? ((dateContext.month + i - 1) % 12) + 1 : null;
  const choiceLabel = isChoiceQuestion && i < parsedChoices.length ? ` → 선택지: "${parsedChoices[i]}"` : '';
  return `${i + 1}. ${dc.positionMeaning}${targetMonth ? ` (${targetMonth}월)` : ''}${choiceLabel}: ${dc.card.nameKo}(${dc.isReversed ? '역방향' : '정방향'}) - ${dc.isReversed ? dc.card.reversedMeaning : dc.card.uprightMeaning}${dc.card.element ? ` [${dc.card.element}]` : ''}`;
}).join('\n')}
${adviceCard ? `조언 카드: ${adviceCard.card.nameKo}(${adviceCard.isReversed ? '역방향' : '정방향'}) - ${adviceCard.isReversed ? adviceCard.card.reversedMeaning : adviceCard.card.uprightMeaning}` : ''}

[현재 시기] ${dateContext.month}월, ${dateContext.season}, ${dateContext.jieqi}, 계절 기운: ${seasonalElement}
${dailyFortuneInstruction}
아래 JSON 형식으로만 응답하세요. 각 필드의 내용은 마크다운 없이 순수 텍스트로 작성하세요.
${userName ? `"${userName}님"이라고 자연스럽게 호칭하세요.` : '"당신"이라고 호칭하세요.'}
역방향 카드는 반드시 역방향 의미로만 해석하세요.
좋은 점만 말하지 말고 주의점과 어려움도 솔직하게 전달하세요.
${previousContext && previousContext.length > 0 ? `
⚠️ 이전 상담 연결 (매우 중요!):
- 이 사용자는 최근에 아래와 같은 상담을 받았습니다. 이전 흐름을 자연스럽게 연결하세요.
${previousContext.map((ctx, i) => `  ${i + 1}. "${ctx.question}" (${ctx.date})`).join('\n')}
- 이전 상담의 주제와 오늘 질문이 연결된다면, "지난번 ~에 대해 상담하셨는데, 그 흐름을 이어서 보면..." 처럼 자연스럽게 언급하세요.
- 이전 상담과 관련 없는 새 질문이라면 억지로 연결하지 마세요.` : ''}

⚠️ 가독성 규칙 (매우 중요!):
- 모든 필드에서 문단 사이에 반드시 줄바꿈(\\n\\n)을 넣으세요.
- 한 문단은 2~3문장을 넘기지 마세요. 긴 덩어리 텍스트는 금지!
- cardReadings에서 각 카드 해석 사이에 반드시 줄바꿈(\\n\\n)으로 구분하세요.
- practiceAdvice에서도 각 항목 사이에 줄바꿈(\\n\\n)을 넣으세요.

⚠️ 카드 해석 방식 (매우 중요!):
- 각 카드를 해석할 때, 먼저 카드의 그림과 상징을 묘사하세요. 예: "이 카드에는 달빛 아래 두 개의 탑 사이로 길이 나 있고, 개와 늑대가 달을 향해 울부짖는 모습이 그려져 있어요. 이 그림은 불확실성과 내면의 불안을 상징해요."
- 그 다음에 카드의 상징이 질문과 어떻게 연결되는지 설명하세요.
- 사주/신살/별자리 연결은 그 뒤에 자연스럽게 덧붙이세요. 모든 카드를 억지로 사주에 연결하지 마세요. 자연스러운 연결이 있을 때만 언급하세요.
- 별자리 정보가 있다면, 카드 해석 중 별자리 특성과 자연스럽게 연결되는 부분이 있을 때 언급하세요. (예: "사자자리의 리더십 기질이 이 카드의 메시지와 맞닿아 있어요")
${isChoiceQuestion ? `\n⚠️ 선택지 질문 해석 방식:\n- 각 카드가 어떤 선택지를 대표하는지 명확히 밝히세요.\n- 각 선택지의 장단점을 카드를 통해 구체적으로 설명하세요.\n- 마지막에 "종합적으로 어떤 선택이 더 유리한지" 명확한 조언을 제시하세요.\n` : ''}
{
  "summary": "${isDailyFortune
    ? `${userName ? userName + '님' : ''}에게 전하는 오늘(${dateContext.solarDate} ${dateContext.weekday})의 인사 + 오늘의 절기(${dateContext.jieqi})와 사주의 관계를 간단히 언급 + 오늘의 전체적인 운세 핵심 한 줄 요약 (300자).${previousContext && previousContext.length > 0 ? ` 최근 상담에서 '${previousContext[0].question}'을 물어본 적이 있으니, 그 흐름과 연결하여 오늘의 운세를 자연스럽게 이어가세요.` : ''} 예: "안녕하세요! 오늘은 절기상 ${dateContext.jieqi} 시기로, ${seasonalElement}. ${userName ? userName + '님의' : '당신의'} ${userElement} 기운과 [상생/상극] 관계를 이루어..." 인사와 결론 사이에 줄바꿈을 넣으세요.`
    : `${userName ? userName + '님' : ''}에게 전하는 인사 + 핵심 결론 한 문장 + 간단한 이유 (250~300자). ${previousContext && previousContext.length > 0 ? `최근 '${previousContext[0].question}'(${previousContext[0].date}) 상담과 오늘 질문이 연결된다면 흐름을 자연스럽게 이어가세요. 연결이 없다면 무시.` : ''} 분석 계획의 '해석 방향'과 '전체 톤'을 반영하여 명확한 결론을 제시하세요. 모호하지 않게! 인사와 결론 사이에 줄바꿈을 넣으세요.`}",
  "cardReadings": "${isDailyFortune
    ? `오늘의 운세를 총운/금전운/연애운 순서로 해석합니다. 각 운에 대해: (1) 카드 그림/상징 묘사 2~3문장 (2) 이 카드가 오늘의 해당 운세에서 의미하는 바 (3) 사주의 ${userElement} 기운과 오늘 절기(${dateContext.jieqi})의 영향을 연결 (4) 신살 중 관련 있는 것 언급 ${userMbti ? `(5) ${userMbti} 성향에 맞는 구체적 조언` : ''}. 각 운세별 400~500자. 각 운세 해석 사이에 반드시 줄바꿈(\\n\\n)을 넣으세요.`
    : `${mainCards.map((dc, i) => `${i + 1}. ${dc.card.nameKo}(${dc.positionMeaning})${isChoiceQuestion && i < parsedChoices.length ? ` → "${parsedChoices[i]}"` : ''}`).join(', ')} 각 카드를 해석하되, 반드시 이 순서를 따르세요: (1) 카드 그림/상징 묘사 2~3문장 (2) 이 상징이 질문에 어떤 의미인지 해석 ${isChoiceQuestion ? '(해당 선택지와 연결하여 장단점 분석)' : ''} (3) 사주/신살과 자연스러운 연결이 있으면 덧붙이기. 카드당 300~400자. 각 카드 해석 사이에 반드시 줄바꿈(\\n\\n)을 넣으세요.${isChoiceQuestion ? ' 마지막에 선택지 간 비교 총평을 추가하세요.' : ''}`}",
  "elementalHarmony": "${isDailyFortune
    ? `오늘(${dateContext.solarDate})은 절기상 ${dateContext.jieqi} 시기로 ${seasonalElement}. 이 계절 기운이 사용자의 ${userElement} 일간과 어떻게 작용하는지 자연 비유로 설명.${zodiacInfo ? ` 별자리(${zodiacInfo.sign}, ${zodiacInfo.element} 원소)와 사주 오행의 동서양 에너지 조화도 함께 설명.` : ''} 오늘 하루 특히 주의할 오행 에너지와 활용할 에너지를 구체적으로 안내 (300자).`
    : `현재 ${dateContext.season}(${seasonalElement} 기운)과 사용자의 ${userElement} 기운, 카드들의 오행이 어떻게 조화/충돌하는지 자연 비유로 설명.${zodiacInfo ? ` 서양 별자리(${zodiacInfo.sign})의 ${zodiacInfo.element} 원소와 동양 오행(${userElement})의 조화/보완 관계도 언급.` : ''} (300자).`}",
  "practiceAdvice": "${isDailyFortune
    ? `오늘 하루 실천할 수 있는 구체적 조언을 총운/금전운/연애운별로 정리. 럭키 컬러, 럭키 아이템, 좋은 방위 등을 하나씩 추천. 강한 오행(${sajuAnalysis.strongElements.join(',')}) 활용법 + 약한 오행(${sajuAnalysis.weakElements.join(',')}) 보완법 포함 (400자)`
    : `카드별 구체적 실천 방법을 각각 줄바꿈으로 구분하여 작성 + 강한 오행(${sajuAnalysis.strongElements.join(',')}) 활용법 + 약한 오행(${sajuAnalysis.weakElements.join(',')}) 보완법 (350자)`}"${includeAdviceCard && adviceCard ? `,
  "adviceCardReading": "조언 카드 ${adviceCard.card.nameKo}의 그림/상징을 먼저 설명하고, 그 메시지가 현재 상황에서 어떤 실천 조언이 되는지 서술 (250자)"` : ''}${userMbti ? `,
  "mbtiAdvice": "분석 계획의 MBTI 인사이트를 바탕으로, ${userMbti} 타입이 이 상황에서 주의할 점과 강점 활용법 (200자)"` : ''}${partnerSajuAnalysis ? `,
  "compatibilityReading": "두 사람의 궁합 심층 분석 (400~500자):\\n\\n오행 관계: 나(${sajuAnalysis.dayMasterElement})와 상대(${partnerSajuAnalysis.dayMasterElement})의 상생/상극 관계와 그 의미\\n\\n신살 교차: 두 사람의 신살이 관계에 미치는 영향 (분석 계획의 compatibilityInsight 반영)${partnerMbti ? `\\n\\nMBTI 궁합: ${userMbti ? `${userMbti}(나)` : ''}${userMbti && partnerMbti ? ' vs ' : ''}${partnerMbti}(상대) 두 유형의 소통 방식과 관계 역학` : ''}\\n\\n타로 카드 연결: 뽑힌 카드들이 두 사람의 관계에서 어떤 메시지를 전하는지\\n\\n총평: 이 관계의 강점과 주의점, 앞으로를 위한 조언. 각 항목 사이에 줄바꿈(\\\\n\\\\n)으로 구분"` : ''}
}`;

    try {
      let response = '';
      const cardCount = drawnCards.length;
      let maxTokens: number;

      switch(spreadType) {
        case 'celtic-cross': maxTokens = 10000; break;
        case 'six-months': maxTokens = 8000; break;
        case 'saju-custom': maxTokens = 7000; break;
        case 'compatibility': maxTokens = 6000; break;
        case 'daily-fortune': maxTokens = 7000; break;
        case 'three-card':
        case 'problem-solution':
        case 'two-card': maxTokens = 5000; break;
        case 'one-card':
        case 'yes-no': maxTokens = 3500; break;
        default: maxTokens = cardCount >= 6 ? 8000 : cardCount >= 4 ? 6000 : 5000;
      }
      if (includeAdviceCard) maxTokens += 1000;
      if (userMbti) maxTokens += 800;
      if (partnerSajuAnalysis) maxTokens += 1500;
      if (partnerMbti) maxTokens += 500;
      if (analysisContext.keySals.length > 0) maxTokens += Math.min(analysisContext.keySals.length * 300, 1500);
      if (zodiacInfo) maxTokens += 600;

      if (this.gemini) {
        try {
          response = await this.tryGeminiWithFallback(prompt, maxTokens);
        } catch (geminiError) {
          console.warn('⚠️ Step 2 Gemini 실패, Claude fallback:', (geminiError as Error).message);
        }
      }
      if (!response && this.claude) {
        const message = await this.claude.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        });
        response = message.content[0].type === 'text' ? message.content[0].text : '';
      }
      if (!response) {
        throw new Error('AI 서비스를 사용할 수 없습니다.');
      }

      console.log(`📊 Step 2 해석 생성 완료 - 카드 ${cardCount}장, max_tokens: ${maxTokens}, 응답 길이: ${response.length}자`);

      // JSON 파싱 (제어문자 정리 후)
      const sanitized = this.sanitizeJsonResponse(response);
      const jsonMatch = sanitized.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Step 2 JSON 파싱 실패');

      const parsed = JSON.parse(jsonMatch[0]);

      // 구조화된 JSON → 기존 반환 형식으로 변환
      const interpretation = parsed.summary && parsed.cardReadings
        ? `${parsed.summary}\n\n===CARD_DETAILS===\n\n${parsed.cardReadings}`
        : parsed.summary || parsed.cardReadings || response.substring(0, 500);

      const personalizedAdviceParts = [parsed.practiceAdvice];
      if (parsed.mbtiAdvice) personalizedAdviceParts.push(parsed.mbtiAdvice);

      const result: {
        interpretation: string;
        elementalHarmony: string;
        personalizedAdvice: string;
        adviceCardInterpretation?: string;
        compatibilityReading?: string;
      } = {
        interpretation,
        elementalHarmony: parsed.elementalHarmony || '오행의 흐름을 분석하고 있어요.',
        personalizedAdvice: personalizedAdviceParts.filter(Boolean).join('\n\n') || '실천 가능한 조언을 준비하고 있어요.'
      };

      if (parsed.adviceCardReading) {
        result.adviceCardInterpretation = parsed.adviceCardReading;
      }

      if (parsed.compatibilityReading) {
        result.compatibilityReading = parsed.compatibilityReading;
      }

      console.log('✅ Step 2 파싱 완료:', {
        interpretationLen: result.interpretation.length,
        harmonyLen: result.elementalHarmony.length,
        adviceLen: result.personalizedAdvice.length,
        hasAdviceCard: !!result.adviceCardInterpretation
      });

      return result;
    } catch (error) {
      console.error('❌ Step 2 해석 생성 실패:', error);
      throw error;
    }
  }

  // JSON 문자열 내 제어문자 정리 (Gemini가 문자열 값 안에 raw 줄바꿈/탭을 넣는 문제 해결)
  private sanitizeJsonResponse(text: string): string {
    // JSON 문자열 값 내부의 이스케이프되지 않은 제어문자를 공백으로 치환
    // 문자열 밖의 공백/줄바꿈은 JSON.parse가 자체 처리하므로 건드리지 않음
    return text.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
      const cleaned = inner
        .replace(/[\x00-\x1F\x7F]/g, (ch: string) => {
          if (ch === '\n') return '\\n';
          if (ch === '\r') return '\\r';
          if (ch === '\t') return '\\t';
          return ' ';
        });
      return `"${cleaned}"`;
    });
  }

  // Gemini 모델 fallback 로직
  private async tryGeminiWithFallback(prompt: string, maxTokens: number = 1024, options?: { jsonMode?: boolean; minLength?: number }): Promise<string> {
    if (!this.gemini) {
      throw new Error('Gemini API가 초기화되지 않았습니다.');
    }

    const generationConfig: Record<string, unknown> = { maxOutputTokens: maxTokens };
    if (options?.jsonMode) {
      generationConfig.responseMimeType = 'application/json';
    }

    for (const modelName of this.geminiModels) {
      try {
        console.log(`🤖 Gemini 모델 시도: ${modelName}`);
        const model = this.gemini.getGenerativeModel({
          model: modelName,
          generationConfig: generationConfig as any
        });
        const result = await model.generateContent(prompt);

        // 응답 검증
        let responseText = result.response.text();
        if (!responseText || responseText.trim() === '') {
          console.warn(`⚠️ ${modelName}: 빈 응답 반환됨, 다음 모델 시도...`);
          continue;
        }

        // 제어문자 정리 (Gemini가 JSON 문자열 안에 raw 줄바꿈/탭을 넣는 문제)
        responseText = this.sanitizeJsonResponse(responseText);

        // jsonMode일 때: 유효한 JSON이고 필드가 2개 이상인지 검증
        if (options?.jsonMode) {
          try {
            const testParsed = JSON.parse(responseText);
            if (!testParsed || typeof testParsed !== 'object' || Object.keys(testParsed).length < 2) {
              console.warn(`⚠️ ${modelName}: JSON 필드 부족 (${Object.keys(testParsed || {}).length}개), 다음 모델 시도...`);
              continue;
            }
            console.log(`✅ ${modelName} 성공 (유효 JSON, ${Object.keys(testParsed).length}필드, ${responseText.length}자)`);
            return responseText;
          } catch {
            console.warn(`⚠️ ${modelName}: jsonMode인데 JSON 파싱 실패, 다음 모델 시도...`);
            continue;
          }
        }

        // 비-jsonMode: 최소 길이 검증
        if (options?.minLength && responseText.length < options.minLength) {
          console.warn(`⚠️ ${modelName}: 응답이 너무 짧음 (${responseText.length}자 < ${options.minLength}자), 다음 모델 시도...`);
          continue;
        }

        console.log(`✅ ${modelName} 성공 (응답 길이: ${responseText.length}자)`);
        return responseText;
      } catch (error: any) {
        const errorMessage = error?.message || String(error);
        const isRetryableError = errorMessage.includes('429') || 
                            errorMessage.includes('quota') || 
                            errorMessage.includes('RESOURCE_EXHAUSTED') ||
                            errorMessage.includes('rate limit') ||
                            errorMessage.includes('fetch failed') ||
                            errorMessage.includes('ECONNRESET') ||
                            errorMessage.includes('ETIMEDOUT') ||
                            errorMessage.includes('socket hang up') ||
                            errorMessage.includes('network') ||
                            errorMessage.includes('SAFETY') ||
                            errorMessage.includes('blocked');
        
        console.warn(`⚠️ ${modelName} 실패:`, errorMessage.substring(0, 150));
        
        if (isRetryableError) {
          console.log(`🔄 재시도 가능한 에러, 다음 모델로 전환...`);
          continue;
        }
        // 재시도 불가능한 에러는 바로 throw
        throw error;
      }
    }
    
    throw new Error('모든 Gemini 모델의 할당량이 소진되었습니다. 잠시 후 다시 시도해주세요.');
  }

  // ============================================================
  // 질문에서 선택지(A/B/C) 파싱
  // ============================================================
  private parseChoicesFromQuestion(question: string): string[] {
    if (!question) return [];

    // 패턴 1: "A가 좋을까 B가 좋을까 C가 좋을까"
    const choicePattern1 = /([^,?\s가이을를][^,?가이을를]{0,20})(?:가|이|을|를)\s*(?:좋을까|나을까|맞을까|괜찮을까|좋은|나은|맞는|좋겠|나을|할까)/g;
    const matches1: string[] = [];
    let m;
    while ((m = choicePattern1.exec(question)) !== null) {
      matches1.push(m[1].trim());
    }
    if (matches1.length >= 2) return matches1;

    // 패턴 2: "A vs B" / "A 아니면 B"
    const vsMatch = question.match(/(.+?)\s*(?:vs|VS|아니면|또는|혹은)\s*(.+?)(?:\s*(?:vs|VS|아니면|또는|혹은)\s*(.+?))?(?:\?|$)/i);
    if (vsMatch) {
      const choices = [vsMatch[1].trim(), vsMatch[2].trim()];
      if (vsMatch[3]) choices.push(vsMatch[3].trim());
      return choices.filter(c => c.length > 0 && c.length <= 30);
    }

    // 패턴 3: "A, B, C 중에" / "A B C 중에서"
    const listMatch = question.match(/(.+?)\s*중에?서?/i);
    if (listMatch) {
      const items = listMatch[1].split(/[,，]|\s+(?:그리고|와|과|하고)\s+/).map((s: string) => s.trim()).filter((s: string) => s.length > 0 && s.length <= 30);
      if (items.length >= 2) return items;
    }

    return [];
  }

  // ============================================================
  // 궁합 분석 헬퍼 메서드들
  // ============================================================

  // 두 오행 간 상생/상극 관계 분석
  private analyzeElementRelation(myElement: string, partnerElement: string): string {
    const generates: Record<string, string> = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' };
    const controls: Record<string, string> = { 목: '토', 토: '수', 수: '화', 화: '금', 금: '목' };

    if (generates[myElement] === partnerElement) return `상생 관계 (내가 상대를 도움 - ${myElement}생${partnerElement})`;
    if (generates[partnerElement] === myElement) return `상생 관계 (상대가 나를 도움 - ${partnerElement}생${myElement})`;
    if (controls[myElement] === partnerElement) return `상극 관계 (내가 상대를 제압 - ${myElement}극${partnerElement})`;
    if (controls[partnerElement] === myElement) return `상극 관계 (상대가 나를 제압 - ${partnerElement}극${myElement})`;
    if (myElement === partnerElement) return `비화 관계 (같은 오행 - 서로 경쟁하거나 돕는 동반자)`;
    return `중립 관계`;
  }

  // 천간합 분석
  private analyzeStemRelation(myStem: string, partnerStem: string): string {
    const heavenlyPairs: [string, string, string][] = [
      ['갑', '기', '토 기운으로 합화'],
      ['을', '경', '금 기운으로 합화'],
      ['병', '신', '수 기운으로 합화'],
      ['정', '임', '목 기운으로 합화'],
      ['무', '계', '화 기운으로 합화']
    ];
    for (const [a, b, result] of heavenlyPairs) {
      if ((myStem === a && partnerStem === b) || (myStem === b && partnerStem === a)) {
        return `천간합 (${a}${b}합 - ${result}, 강한 인연)`;
      }
    }
    return '합 없음';
  }

  // 지지충 분석
  private analyzeBranchConflict(myBranch: string, partnerBranch: string): string {
    const conflictPairs: [string, string][] = [
      ['자', '오'], ['축', '미'], ['인', '신'],
      ['묘', '유'], ['진', '술'], ['사', '해']
    ];
    for (const [a, b] of conflictPairs) {
      if ((myBranch === a && partnerBranch === b) || (myBranch === b && partnerBranch === a)) {
        return `${a}${b}충 - 갈등과 긴장이 있지만 강한 에너지 교환`;
      }
    }
    return '충 없음';
  }

  // 공통 신살 분석
  private analyzeSharedSals(mySals: any[], partnerSals: any[]): string {
    const myNames = new Set(mySals.map((s: any) => s.name));
    const partnerNames = new Set(partnerSals.map((s: any) => s.name));
    const shared = [...myNames].filter(name => partnerNames.has(name));

    const relationSals: Record<string, string> = {
      '도화살': '서로에게 강한 이성적 매력, 바람기 주의',
      '역마살': '함께 이동/변화가 많은 관계',
      '천을귀인': '서로가 서로에게 귀인',
      '원진살': '끌리면서도 상처 주는 관계',
      '화개살': '영적/예술적으로 깊이 통하는 관계'
    };

    if (shared.length === 0) return '공통 신살 없음';
    return shared.map(name => `${name}(${relationSals[name] || '공통 에너지'})`).join(', ');
  }

  // AI 응답 파싱
  private parseAIResponse(response: string): {
    interpretation: string;
    elementalHarmony: string;
    personalizedAdvice: string;
    adviceCardInterpretation?: string;
  } {
    const sections: {
      interpretation: string;
      elementalHarmony: string;
      personalizedAdvice: string;
      adviceCardInterpretation?: string;
    } = {
      interpretation: '',
      elementalHarmony: '',
      personalizedAdvice: ''
    };

    // [질문에 대한 결론] + [각 타로 카드의 상세 해석] 합쳐서 interpretation으로
    // ※ 핵심 요약(결론)과 카드 상세 해석 사이에 "===CARD_DETAILS===" 구분자 삽입

    // 결론 추출 - 여러 패턴 시도 (AI가 헤더를 다르게 쓸 수 있음)
    const conclusionPatterns = [
      /\[질문에 대한 결론\]\s*([\s\S]*?)(?=\[각 타로 카드|\[카드가 말해주는)/i,
      /\[질문에 대한 결론\]\s*([\s\S]*?)(?=\n\n\[)/i,
      /\[핵심 ?요약\]\s*([\s\S]*?)(?=\n\n\[)/i,
      /\[결론\]\s*([\s\S]*?)(?=\n\n\[)/i,
    ];
    let conclusionText = '';
    for (const pattern of conclusionPatterns) {
      const match = response.match(pattern);
      if (match && match[1].trim().length > 10) {
        conclusionText = match[1].trim();
        break;
      }
    }

    // 카드 상세 해석 추출 - 여러 패턴 시도
    const cardDetailPatterns = [
      /\[각 타로 카드의 상세 해석\]\s*([\s\S]*?)(?=\[전체 카드의 흐름|\[오행의 흐름)/i,
      /\[각 타로 카드의 상세 해석\]\s*([\s\S]*?)(?=\n---\n)/i,
      /\[카드가 말해주는 이야기\]\s*([\s\S]*?)(?=\[전체 카드|\[오행|---)/i,
      /\[카드 해석\]\s*([\s\S]*?)(?=\[전체|\[오행|---)/i,
    ];
    let cardDetailsText = '';
    for (const pattern of cardDetailPatterns) {
      const match = response.match(pattern);
      if (match && match[1].trim().length > 10) {
        cardDetailsText = match[1].trim();
        break;
      }
    }

    // 디버깅 로그
    console.log('=== 파싱 디버깅 ===');
    console.log('conclusionText 길이:', conclusionText.length);
    console.log('cardDetailsText 길이:', cardDetailsText.length);
    if (conclusionText) {
      console.log('결론 내용 (앞 200자):', conclusionText.substring(0, 200));
    }

    if (conclusionText && cardDetailsText) {
      sections.interpretation = `${conclusionText}\n\n===CARD_DETAILS===\n\n${cardDetailsText}`;
    } else if (cardDetailsText) {
      sections.interpretation = `===CARD_DETAILS===\n\n${cardDetailsText}`;
    } else if (conclusionText) {
      sections.interpretation = conclusionText;
    } else {
      // Fallback: 이전 형식 지원
      const answerMatch = response.match(/\[질문에 대한 답변\]\s*([\s\S]*?)(?=\n\n\[|$)/i);
      const situationMatch = response.match(/\[현재 상황과 흐름\]\s*([\s\S]*?)(?=\n\n\[|$)/i);

      if (answerMatch && answerMatch[1].trim().length > 10 && situationMatch && situationMatch[1].trim().length > 10) {
        sections.interpretation = `${answerMatch[1].trim()}\n\n===CARD_DETAILS===\n\n${situationMatch[1].trim()}`;
      } else if (answerMatch && answerMatch[1].trim().length > 10) {
        sections.interpretation = answerMatch[1].trim();
      }
    }

    // 최종 안전장치: interpretation이 여전히 비어있으면 --- 기반 fallback 즉시 적용
    if (!sections.interpretation || sections.interpretation.length < 20) {
      const parts = response.split(/\n---\n|\n-{3,}\n/).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length > 0) {
        // 첫 번째 의미 있는 파트를 핵심요약으로 사용 (헤더 제거)
        const cleanPart = (text: string) => text.replace(/^\[.*?\]\s*/gm, '').trim();
        const summary = cleanPart(parts[0]);
        const details = parts.length > 1 ? cleanPart(parts[1]) : '';
        if (summary.length > 10) {
          sections.interpretation = details.length > 10
            ? `${summary}\n\n===CARD_DETAILS===\n\n${details}`
            : summary;
        }
      }
    }

    // 마지막 안전장치: 그래도 비어있으면 응답 전체에서 첫 의미있는 문단 추출
    if (!sections.interpretation || sections.interpretation.length < 20) {
      const paragraphs = response.split(/\n\n+/).filter(p => p.trim().length > 30 && !p.startsWith('['));
      if (paragraphs.length > 0) {
        sections.interpretation = paragraphs[0].trim();
        console.warn('⚠️ 모든 파싱 실패, 첫 문단을 핵심요약으로 사용:', sections.interpretation.substring(0, 100));
      } else {
        sections.interpretation = response.substring(0, 500).trim();
        console.warn('⚠️ 최종 fallback: 응답 앞 500자를 핵심요약으로 사용');
      }
    }

    console.log('최종 interpretation 길이:', sections.interpretation.length);
    console.log('구분자 포함 여부:', sections.interpretation.includes('===CARD_DETAILS==='));

    // [오행의 흐름과 현재 시기] 추출
    const harmonyMatch = response.match(/\[오행의 흐름과 현재 시기\]\s*([\s\S]*?)(?=---|$)/i);
    if (harmonyMatch) {
      sections.elementalHarmony = harmonyMatch[1].trim().replace(/^\[.*?\]\s*/, '');
    } else {
      // Fallback: 이전 형식
      const oldHarmonyMatch = response.match(/\[오행의 흐름\]\s*([\s\S]*?)(?=---|$)/i);
      if (oldHarmonyMatch) {
        sections.elementalHarmony = oldHarmonyMatch[1].trim().replace(/^\[.*?\]\s*/, '');
      }
    }

    // [카드별 실천 메시지] + [종합 실천 조언] → personalizedAdvice
    const practiceMatch = response.match(/\[카드별 실천 메시지\]\s*([\s\S]*?)(?=---|$)/i);
    const overallAdviceMatch = response.match(/\[종합 실천 조언\]\s*([\s\S]*?)(?=---|$)/i);
    
    if (practiceMatch || overallAdviceMatch) {
      const practice = practiceMatch ? practiceMatch[1].trim().replace(/^\[.*?\]\s*/, '') : '';
      const overall = overallAdviceMatch ? overallAdviceMatch[1].trim().replace(/^\[.*?\]\s*/, '') : '';
      sections.personalizedAdvice = [practice, overall].filter(Boolean).join('\n\n');
    } else {
      // Fallback: 이전 형식
      const adviceMatch = response.match(/\[실천할 수 있는 조언\]\s*([\s\S]*?)(?=---|$)/i);
      if (adviceMatch) {
        sections.personalizedAdvice = adviceMatch[1].trim().replace(/^\[.*?\]\s*/, '');
      }
    }

    // [조언 카드의 특별한 메시지] → adviceCardInterpretation
    const adviceCardMatch = response.match(/\[조언 카드의 특별한 메시지\]\s*([\s\S]*?)$/i);
    if (adviceCardMatch) {
      sections.adviceCardInterpretation = adviceCardMatch[1].trim().replace(/^\[.*?\]\s*/, '');
    } else {
      // Fallback: 이전 형식
      const oldAdviceCardMatch = response.match(/\[조언 카드의 메시지\]\s*([\s\S]*?)$/i);
      if (oldAdviceCardMatch) {
        sections.adviceCardInterpretation = oldAdviceCardMatch[1].trim().replace(/^\[.*?\]\s*/, '');
      }
    }

    // Fallback: --- 로 나뉜 부분으로 비어있는 필드 채우기
    if (!sections.elementalHarmony || !sections.personalizedAdvice) {
      const parts = response.split(/\n---\n|\n-{3,}\n/).map(p => p.trim()).filter(p => p.length > 10);
      if (parts.length >= 3) {
        if (!sections.elementalHarmony) {
          sections.elementalHarmony = parts[2]?.replace(/^\[.*?\]\s*/gm, '').trim() || '오행의 흐름을 분석하고 있어요.';
        }
        if (!sections.personalizedAdvice && parts.length >= 4) {
          sections.personalizedAdvice = parts[3]?.replace(/^\[.*?\]\s*/gm, '').trim() || '실천 가능한 조언을 준비하고 있어요.';
        }
      }
      // 최종 기본값
      if (!sections.elementalHarmony) sections.elementalHarmony = '오행의 흐름을 분석하고 있어요.';
      if (!sections.personalizedAdvice) sections.personalizedAdvice = '실천 가능한 조언을 준비하고 있어요.';
    }

    return sections;
  }

  // 리딩 결과에 대한 채팅
  async chatAboutReading(
    question: string,
    reading: any,
    chatHistory: Array<{ role: string; content: string }>,
    userName?: string
  ): Promise<string> {
    const userElement = reading.sajuAnalysis?.dayMasterElement || '';
    const elementDescriptions: Record<string, string> = {
      '목': '나무의 기운으로 창의적이고 유연한',
      '화': '불의 기운으로 열정적이고 활동적인',
      '토': '흙의 기운으로 안정적이고 포용력 있는',
      '금': '금속의 기운으로 논리적이고 원칙을 중시하는',
      '수': '물의 기운으로 유연하고 지혜로운'
    };
    const elementDesc = elementDescriptions[userElement] || '';

    const prompt = `당신은 타로와 사주 만세력에 정통한 친절한 상담사입니다.

[사용자의 사주 정보]
${userName ? `이름: ${userName}님` : ''}
${reading.sajuAnalysis ? `
- 일간: ${reading.sajuAnalysis.dayMaster} (${reading.sajuAnalysis.dayMasterElement})
- ${userName ? userName + '님은' : '이 분은'} ${elementDesc} 성향을 가진 분입니다
- 강한 오행: ${reading.sajuAnalysis.strongElements?.join(', ') || '정보 없음'}
- 약한 오행: ${reading.sajuAnalysis.weakElements?.join(', ') || '정보 없음'}
- 성격 특성: ${reading.sajuAnalysis.personality || '정보 없음'}
` : '사주 정보 없음'}

[타로 리딩 결과]
- 원래 질문: ${reading.question || '없음'}
- 뽑은 카드: ${reading.drawnCards?.map((dc: any) => `${dc.card.nameKo} (${dc.isReversed ? '역방향' : '정방향'}, ${dc.card.element || ''})`).join(', ')}
- 종합 해석: ${reading.interpretation || reading.integrated || '정보 없음'}
- 오행의 흐름: ${reading.elementalHarmony || '정보 없음'}
- 실천 조언: ${reading.personalizedAdvice || '정보 없음'}

[이전 대화]
${chatHistory.slice(-3).map(msg => `${msg.role === 'user' ? '사용자' : '상담사'}: ${msg.content}`).join('\n')}

[현재 질문]
${question}

⚠️ 중요한 답변 규칙:
- 마크다운 문법을 절대 사용하지 마세요 (*, **, #, -, > 등 모두 금지)
- ${userName ? userName + '님' : '당신'}을 자연스럽게 호칭하세요
- 편안하고 친근한 "~해요", "~이에요" 말투 사용
- ${userName ? userName + '님의' : '당신의'} 사주 오행을 비유로 설명 (예: "${userElement} 기운이 ${userElement === '수' ? '물처럼 유연하게' : userElement === '목' ? '나무처럼 성장하며' : userElement === '화' ? '불처럼 열정적으로' : userElement === '토' ? '흙처럼 안정적으로' : '금속처럼 단단하게'} 작용하고 있어요")
- ${userName ? userName + '님의' : '사용자의'} 사주와 타로 결과를 함께 고려해서 답변하세요
- 구체적이고 실천 가능한 조언 제공
- 답변은 250자 내외로 작성
- 질문이 관련 없으면 부드럽게 리딩과 연결해서 답변하세요
- 새로운 통찰이나 구체적인 예시를 들어주세요
- 좋은 점만 말하지 말고, 주의해야 할 점이나 어려움도 솔직하게 전달하세요
- 현실적이고 균형 잡힌 조언을 제공하세요`;

    try {
      let response: string = '';

      // 챗봇은 Claude 먼저 사용 (더 안정적)
      if (this.claude) {
        console.log('🤖 Claude로 챗봇 응답 생성...');
        const message = await this.claude.messages.create({
          // Claude 4.5 모델 (2025년 최신) - 코딩 우수성, 에이전트 기능, 창의적 콘텐츠 생성에 최적화
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        });
        response = message.content[0].type === 'text' ? message.content[0].text : '';
      } else if (this.gemini) {
        // Claude 없으면 Gemini 사용
        response = await this.tryGeminiWithFallback(prompt, 500);
      }

      if (!this.gemini && !this.claude) {
        throw new Error('AI 서비스를 사용할 수 없습니다.');
      }

      const trimmedResponse = response.trim();
      if (!trimmedResponse) {
        console.error('Chat AI 빈 응답 (Gemini + Claude 모두 실패)');
        return '죄송해요, 잠시 생각이 필요해요. 다시 한번 질문해 주시겠어요? 🙏';
      }
      return trimmedResponse;
    } catch (error) {
      console.error('Chat AI 오류:', error);
      // 에러 발생 시 기본 응답 반환 (throw 대신)
      return '죄송해요, 지금은 답변을 드리기 어려워요. 잠시 후 다시 시도해 주세요. 🙏';
    }
  }
}

// 싱글톤 인스턴스를 lazy 로드
class AIServiceSingleton {
  private static instance: AIService | null = null;

  static getInstance(): AIService {
    if (!AIServiceSingleton.instance) {
      console.log('🚀 AI 서비스 인스턴스 생성 중...');
      AIServiceSingleton.instance = new AIService();
    }
    return AIServiceSingleton.instance;
  }
}

export const getAIService = () => AIServiceSingleton.getInstance();

// default export도 getter 함수로 변경
export default new Proxy({} as AIService, {
  get(target, prop) {
    return AIServiceSingleton.getInstance()[prop as keyof AIService];
  }
});
