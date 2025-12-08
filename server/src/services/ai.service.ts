import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import type { SajuAnalysis } from '../models/saju.model';
import type { DrawnCard, SpreadType } from '../models/tarot.model';
import { DateHelper } from '../utils/date-helper';

export class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private claude: Anthropic | null = null;
  private geminiModels = ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'];

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
사용자의 질문을 깊이 읽고, 그 사람이 진짜 알고 싶어하는 것이 무엇인지 파악하세요.
그리고 질문의 본질에 가장 적합한 카드 배열 방식을 추천해주세요.

사용자의 질문: "${question}"

## 사용 가능한 스프레드

### 1장 스프레드
- **one-card**: 지금 이 순간의 핵심 메시지. 오늘 하루, 현재 에너지 확인용
- **yes-no**: 예/아니오 형태의 직관적 답변이 필요할 때

### 2장 스프레드  
- **two-card**: A와 B 두 가지 선택지를 직접 비교할 때 (각 카드가 각 선택지를 대표)
  예: "취업 준비 vs 아르바이트", "A회사 vs B회사", "이 사람 vs 저 사람"
- **problem-solution**: 현재 문제의 원인과 해결책을 알고 싶을 때

### 3장 스프레드
- **three-card**: 과거-현재-미래 흐름, 상황의 전개 과정, 결정의 결과 예측
  선택 질문이지만 시간의 흐름도 보고 싶을 때 적합

### 5장 스프레드
- **saju-custom**: 오행(목화토금수) 에너지와 연결, 타고난 기운 분석

### 6장 스프레드
- **six-months**: 향후 6개월간 월별 흐름. 장기적 시간의 흐름을 볼 때만 사용

### 10장 스프레드
- **celtic-cross**: 복잡한 관계, 다양한 요소가 얽힌 상황, 인생의 큰 결정

## 스프레드 선택 기준

질문을 분석할 때 다음을 고려하세요:

1. **질문에 명확한 두 가지 선택지가 있는가?**
   - "A vs B", "A를 할까 B를 할까" → **two-card** (가장 직접적인 비교)
   - 예: "취업 준비 vs 아르바이트?" → two-card

2. **결정이나 행동에 대한 조언이 필요한가?**
   - "~해도 될까?", "~해야 할까?" → **three-card** (과거 맥락과 미래 결과 포함)

3. **현재 문제의 원인과 해결책을 알고 싶은가?**
   - "왜 이런 상황인지", "어떻게 해결할지" → **problem-solution**

4. **단순히 예/아니오 답변이 필요한가?**
   - "~할 수 있을까?", "~가 맞을까?" (간단한 확인) → **yes-no**

5. **시간의 흐름을 보고 싶은가?**
   - "앞으로 6개월간", "올해 운세" → **six-months**

6. **현재 상태/에너지를 알고 싶은가?**
   - "오늘 어떨까", "지금 나의 상태" → **one-card**

7. **매우 복잡한 상황인가?**
   - 여러 사람, 여러 요소가 얽힌 고민 → **celtic-cross**

## 중요!
- 질문에 "언제"가 있더라도 본질이 선택/결정이면 **two-card** 또는 **three-card**
- A와 B가 명확히 있는 비교 질문은 **two-card**가 가장 적합
- 사용자에게 가장 도움이 되는 방식을 선택하세요

JSON 형식으로 답변:
{
  "analysis": "이 질문의 핵심 의도와 사용자가 진짜 알고 싶어하는 것",
  "recommendedSpread": "one-card/two-card/three-card/celtic-cross/saju-custom/six-months/yes-no/problem-solution 중 하나",
  "reason": "왜 이 스프레드가 이 질문에 가장 적합한지 (2-3문장)"
}
`;

    try {
      let response: string;

      if (this.gemini) {
        response = await this.tryGeminiWithFallback(prompt, 1024);
      } else if (this.claude) {
        const message = await this.claude.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }]
        });
        response = message.content[0].type === 'text' ? message.content[0].text : '';
      } else {
        // Fallback: 기본 로직
        return this.fallbackSpreadRecommendation(question);
      }

      // JSON 파싱
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

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

    // 5. 간단한 현재 상황 질문
    if (lowerQ.includes('오늘') || lowerQ.includes('지금') || lowerQ.length < 10) {
      return {
        analysis: '간단한 질문입니다.',
        recommendedSpread: 'one-card',
        reason: '지금 이 순간의 핵심 메시지를 전달합니다.'
      };
    }

    // 6. 시기/흐름 관련 질문
    const timingKeywords = ['개월', '하반기', '상반기', '올해', '내년', '흐름', '운세'];
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

  // AI 기반 종합 해석
  async generateAdvancedInterpretation(
    sajuAnalysis: SajuAnalysis,
    drawnCards: DrawnCard[],
    spreadType: SpreadType,
    question: string,
    previousContext?: Array<{ date: string; question: string; summary: string }> | null,
    userName?: string,
    includeAdviceCard: boolean = false
  ): Promise<{
    interpretation: string;
    elementalHarmony: string;
    personalizedAdvice: string;
    adviceCardInterpretation?: string;
  }> {
    // 현재 날짜 컨텍스트
    const dateContext = DateHelper.getCurrentDateContext();
    const timingInfo = DateHelper.getTimingDescription(dateContext);
    const seasonalElement = DateHelper.getSeasonalElement(dateContext.season);

    // 이전 리딩 컨텍스트 문자열 생성
    const previousContextText = previousContext && previousContext.length > 0
      ? `\n[이전 타로 리딩 기록]
이 사용자는 과거에 다음과 같은 고민을 하신 적이 있습니다:
${previousContext.map((ctx, i) => `${i + 1}. [${ctx.date}] "${ctx.question}"
   → ${ctx.summary}`).join('\n')}

이전 고민의 흐름과 연결성을 고려하여, 지금의 질문이 과거 고민의 연장선상에 있는지 또는 새로운 국면인지 파악해주세요.
`
      : '';

    // 오행별 자연스러운 설명
    const elementDescriptions: Record<string, string> = {
      '목': '나무의 기운으로, 봄처럼 성장하고 뻗어나가는 에너지입니다. 목 기운이 강한 사람은 창의적이고 유연하며 발전을 추구합니다.',
      '화': '불의 기운으로, 여름처럼 뜨겁고 활동적인 에너지입니다. 화 기운이 강한 사람은 열정적이고 적극적이며 밝은 성격을 지닙니다.',
      '토': '흙의 기운으로, 계절의 전환기처럼 안정되고 중심을 잡는 에너지입니다. 토 기운이 강한 사람은 신뢰할 수 있고 포용력이 있으며 조화를 이룹니다.',
      '금': '금속의 기운으로, 가을처럼 결실을 맺고 정리하는 에너지입니다. 금 기운이 강한 사람은 논리적이고 원칙을 중시하며 결단력이 있습니다.',
      '수': '물의 기운으로, 겨울처럼 고요하고 깊이 있는 에너지입니다. 수 기운이 강한 사람은 유연하고 지혜로우며 투명하고 순수한 면이 있습니다.'
    };

    const userElement = sajuAnalysis.dayMasterElement;
    const elementDesc = elementDescriptions[userElement] || '';
    const namePrefix = userName ? `${userName}님의 ` : '';

    const prompt = `
동양 철학과 타로를 융합한 전문가로서 친근하게 해석해주세요.

[사용자 정보]
${userName ? `이름: ${userName}님` : ''}
일간: ${sajuAnalysis.dayMaster}(${sajuAnalysis.dayMasterElement})
${namePrefix}일간은 ${elementDesc}
강한 오행: ${sajuAnalysis.strongElements.join(', ')} / 약한 오행: ${sajuAnalysis.weakElements.join(', ')}
${previousContextText}

[질문] "${question}"

[뽑힌 타로 카드]
${drawnCards.filter(dc => dc.positionMeaning !== '조언 카드').map((dc, i) => 
  `${i + 1}. ${dc.positionMeaning}: ${dc.card.nameKo}(${dc.isReversed ? '역' : '정'}) - ${dc.isReversed ? dc.card.reversedMeaning : dc.card.uprightMeaning}`
).join('\n')}
${drawnCards.find(dc => dc.positionMeaning === '조언 카드') ? 
  `\n조언: ${drawnCards.find(dc => dc.positionMeaning === '조언 카드')!.card.nameKo}(${drawnCards.find(dc => dc.positionMeaning === '조언 카드')!.isReversed ? '역' : '정'})` : ''}

⚠️ 필수 규칙:
1. 마크다운 절대 금지(*, **, #, -, > 등 일체 사용 금지)
2. "---"로만 섹션 구분
3. ${userName ? userName + '님' : '당신'}을 자연스럽게 호칭
4. 오행 특성을 비유로 풀어서 설명 (예: "물의 기운처럼 유연하고 투명한 ${userName ? userName + '님의' : '당신의'} 성향이...")

[질문에 대한 결론]
${userName ? userName + '님' : '당신'}의 질문에 대한 핵심 답을 명확히 요약 (150~200자)

---

[각 타로 카드의 상세 해석]
${drawnCards.filter(dc => dc.positionMeaning !== '조언 카드').map((dc, i) => {
  const cardElement = dc.card.element ? ` (오행: ${dc.card.element})` : '';
  const currentMonth = dateContext.month;
  const targetMonth = spreadType === 'six-months' ? ((currentMonth + i - 1) % 12) + 1 : null;
  const monthLabel = targetMonth ? `${targetMonth}월` : '';
  return `${i + 1}. ${dc.positionMeaning}${monthLabel ? ` (${monthLabel})` : ''} - ${dc.card.nameKo}${cardElement} ${dc.isReversed ? '(역방향)' : '(정방향)'}:
   
   [카드의 기본 의미]
   ${dc.isReversed ? dc.card.reversedMeaning : dc.card.uprightMeaning}
   
   [사주와의 연결]
   ${userName ? userName + '님의' : '당신의'} 일간 ${sajuAnalysis.dayMaster}(${userElement})은 ${elementDesc.split('.')[0]}입니다.
   이 ${dc.card.nameKo} 카드${dc.card.element ? `의 ${dc.card.element} 기운` : ''}이 ${userName ? userName + '님의' : '당신의'} ${userElement} 기운과 만나 어떤 의미를 만드는지 자연스럽게 풀어서 설명해주세요.
   ${dc.card.element && dc.card.element === userElement ? '같은 오행이므로 에너지가 증폭됩니다.' : ''}
   ${dc.card.element && dc.card.element !== userElement ? `${dc.card.element}과 ${userElement}의 상생/상극 관계를 고려한 해석을 포함해주세요.` : ''}
   
   [현재 상황 해석]
   이 카드가 ${dc.positionMeaning} 위치에 나왔다는 것은, ${userName ? userName + '님의' : '당신의'} ${userElement} 성향 때문에 현재 어떤 상황이나 고민이 생겼는지 구체적으로 해석해주세요.
   
   [실천 메시지]
   ${userName ? userName + '님' : '당신'}이 이 카드의 에너지를 활용하여 현실에서 어떻게 행동해야 하는지 구체적으로 제시 (각 카드당 총 300-400자)`
}).join('\n\n')}

[전체 카드의 흐름과 사주 조화]
위에 나온 모든 카드들이 ${userName ? userName + '님의' : '당신의'} 사주(강한 오행: ${sajuAnalysis.strongElements.join(', ')}, 약한 오행: ${sajuAnalysis.weakElements.join(', ')})와 어떻게 조화를 이루거나 충돌하는지, 그리고 이것이 현재 질문과 어떻게 연결되는지 종합적으로 설명 (300자)
${spreadType === 'six-months' ? `\n\n[향후 6개월 흐름의 핵심 포인트]\n현재 ${dateContext.month}월부터 시작하여 향후 6개월 동안 ${userName ? userName + '님' : '당신'}이 경험하게 될 변화의 흐름을 요약해주세요. 특히 언제쯤 중요한 전환점이 찾아올지, 어느 시기가 가장 유리한지 구체적으로 알려주세요 (250자)` : ''}

---

[오행의 흐름과 현재 시기]
지금은 ${dateContext.season}, ${dateContext.jieqi} 시기로 ${seasonalElement} 기운이 강합니다.
${userName ? userName + '님의' : '당신의'} ${userElement} 기운과 현재 계절의 기운, 그리고 뽑힌 카드들이 어떻게 서로 영향을 주는지 자연스럽게 설명해주세요. 
마치 ${userElement === '수' ? '물이 흐르듯' : userElement === '목' ? '나무가 자라듯' : userElement === '화' ? '불이 타오르듯' : userElement === '토' ? '흙이 품듯' : '금속이 단단해지듯'} ${userName ? userName + '님의' : '당신의'} 에너지가 현재 어떤 상태인지 비유적으로 표현 (250자)

---

[실천할 수 있는 조언]
${dateContext.month}월 현재, ${userName ? userName + '님' : '당신'}이 가진 강한 ${sajuAnalysis.strongElements.join(', ')} 기운을 어떻게 활용하고, 약한 ${sajuAnalysis.weakElements.join(', ')} 기운을 어떻게 보완할지 구체적인 방법을 제시해주세요.
예를 들어 "수 기운이 약하다면 물처럼 유연한 사고를 기르기 위해..."처럼 오행의 특성을 자연스럽게 연결 (250자)
${includeAdviceCard && drawnCards.find(dc => dc.positionMeaning === '조언 카드') ? `
---

[조언 카드의 특별한 메시지]
${(() => {
  const adviceCard = drawnCards.find(dc => dc.positionMeaning === '조언 카드')!;
  const adviceCardElement = adviceCard.card.element ? ` (오행: ${adviceCard.card.element})` : '';
  return `조언 카드: ${adviceCard.card.nameKo}${adviceCardElement} ${adviceCard.isReversed ? '(역방향)' : '(정방향)'}

[카드의 기본 의미]
${adviceCard.isReversed ? adviceCard.card.reversedMeaning : adviceCard.card.uprightMeaning}

[사주와 연결된 조언]
${userName ? userName + '님의' : '당신의'} ${userElement} 기운과 이 조언 카드${adviceCard.card.element ? `의 ${adviceCard.card.element} 기운` : ''}이 만나, 앞으로 어떻게 행동해야 가장 좋은 결과를 얻을 수 있는지 구체적이고 실천 가능한 조언을 제시해주세요.
${adviceCard.card.element ? `특히 ${adviceCard.card.element} 기운을 어떻게 활용하면 좋을지 포함` : ''}해주세요. (300자)`;
})()}` : ''}
`;

    try {
      let response: string;

      if (this.gemini) {
        response = await this.tryGeminiWithFallback(prompt, 4096);
      } else if (this.claude) {
        const message = await this.claude.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }]
        });
        response = message.content[0].type === 'text' ? message.content[0].text : '';
      } else {
        throw new Error('AI 서비스를 사용할 수 없습니다.');
      }

      // 디버깅: AI 응답 전체 로깅
      console.log('=== AI 응답 전체 ===');
      console.log(response);
      console.log('=== AI 응답 끝 ===');

      // 응답 파싱
      const parsed = this.parseAIResponse(response);
      
      // 디버깅: 파싱 결과 로깅
      console.log('=== 파싱 결과 ===');
      console.log('interpretation 길이:', parsed.interpretation.length);
      console.log('elementalHarmony 길이:', parsed.elementalHarmony.length);
      console.log('personalizedAdvice 길이:', parsed.personalizedAdvice.length);
      console.log('=== 파싱 끝 ===');
      
      return parsed;
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      throw new Error('AI 해석을 생성하는 중 오류가 발생했습니다.');
    }
  }

  // Gemini 모델 fallback 로직
  private async tryGeminiWithFallback(prompt: string, maxTokens: number = 1024): Promise<string> {
    if (!this.gemini) {
      throw new Error('Gemini API가 초기화되지 않았습니다.');
    }

    for (const modelName of this.geminiModels) {
      try {
        console.log(`🤖 Gemini 모델 시도: ${modelName}`);
        const model = this.gemini.getGenerativeModel({ 
          model: modelName,
          generationConfig: { maxOutputTokens: maxTokens }
        });
        const result = await model.generateContent(prompt);
        
        // 응답 검증
        const responseText = result.response.text();
        if (!responseText || responseText.trim() === '') {
          console.warn(`⚠️ ${modelName}: 빈 응답 반환됨, 다음 모델 시도...`);
          continue; // 빈 응답이면 다음 모델 시도
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
    const conclusionMatch = response.match(/\[질문에 대한 결론\]\s*([\s\S]*?)(?=---|$)/i);
    const cardDetailsMatch = response.match(/\[각 타로 카드의 상세 해석\]\s*([\s\S]*?)(?=---|$)/i);
    
    if (conclusionMatch && cardDetailsMatch) {
      const conclusion = conclusionMatch[1].trim().replace(/^\[.*?\]\s*/, '');
      const cardDetails = cardDetailsMatch[1].trim().replace(/^\[.*?\]\s*/, '');
      sections.interpretation = `${conclusion}\n\n${cardDetails}`;
    } else if (cardDetailsMatch) {
      sections.interpretation = cardDetailsMatch[1].trim().replace(/^\[.*?\]\s*/, '');
    } else if (conclusionMatch) {
      sections.interpretation = conclusionMatch[1].trim().replace(/^\[.*?\]\s*/, '');
    } else {
      // Fallback: 이전 형식 지원
      const answerMatch = response.match(/\[질문에 대한 답변\]\s*([\s\S]*?)(?=---|$)/i);
      const situationMatch = response.match(/\[현재 상황과 흐름\]\s*([\s\S]*?)(?=---|$)/i);
      
      if (answerMatch && situationMatch) {
        const answer = answerMatch[1].trim().replace(/^\[.*?\]\s*/, '');
        const situation = situationMatch[1].trim().replace(/^\[.*?\]\s*/, '');
        sections.interpretation = `${answer}\n\n${situation}`;
      } else if (answerMatch) {
        sections.interpretation = answerMatch[1].trim().replace(/^\[.*?\]\s*/, '');
      }
    }

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

    // [실천할 수 있는 조언] 추출
    const adviceMatch = response.match(/\[실천할 수 있는 조언\]\s*([\s\S]*?)(?=---|$)/i);
    if (adviceMatch) {
      sections.personalizedAdvice = adviceMatch[1].trim().replace(/^\[.*?\]\s*/, '');
    }

    // [조언 카드의 메시지] 추출
    const adviceCardMatch = response.match(/\[조언 카드의 메시지\]\s*([\s\S]*?)$/i);
    if (adviceCardMatch) {
      sections.adviceCardInterpretation = adviceCardMatch[1].trim().replace(/^\[.*?\]\s*/, '');
    }

    // Fallback: --- 로 나뉜 부분 사용
    const parts = response.split('---').map(p => p.trim());
    if (!sections.interpretation && parts.length > 0) {
      sections.interpretation = parts[0] + '\n\n' + (parts[1] || '');
      sections.elementalHarmony = parts[2] || '오행의 흐름을 분석하고 있어요.';
      sections.personalizedAdvice = parts[3] || '실천 가능한 조언을 준비하고 있어요.';
      sections.adviceCardInterpretation = parts[4] || undefined;
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
- 새로운 통찰이나 구체적인 예시를 들어주세요`;

    try {
      let response: string;

      if (this.gemini) {
        response = await this.tryGeminiWithFallback(prompt, 500);
      } else if (this.claude) {
        const message = await this.claude.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }]
        });
        response = message.content[0].type === 'text' ? message.content[0].text : '';
      } else {
        throw new Error('AI 서비스를 사용할 수 없습니다.');
      }

      const trimmedResponse = response.trim();
      if (!trimmedResponse) {
        console.error('Chat AI 빈 응답');
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
