import { GoogleGenerativeAI } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';
import type { SajuAnalysis } from '../models/saju.model';
import type { DrawnCard, SpreadType } from '../models/tarot.model';
import { DateHelper } from '../utils/date-helper';

export class AIService {
  private gemini: GoogleGenerativeAI | null = null;
  private claude: Anthropic | null = null;

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
당신은 타로 전문가입니다. 사용자의 질문을 분석하고 가장 적합한 타로 스프레드를 추천해주세요.

사용자 질문: "${question}"

다음 스프레드 중 하나를 선택하세요:
1. one-card: 간단하고 명확한 답이 필요한 질문 (예: 오늘의 운세, 간단한 Yes/No)
2. three-card: 시간의 흐름이나 원인-현재-결과를 보는 질문 (예: 이 프로젝트는 어떻게 진행될까?)
3. celtic-cross: 복잡한 상황이나 종합적인 분석이 필요한 질문 (예: 내 인생의 방향은?)
4. saju-custom: 사주와 연관된 오행 균형이 중요한 질문 (예: 나의 재물운/건강운)

JSON 형식으로 답변해주세요:
{
  "analysis": "질문 분석 내용",
  "recommendedSpread": "추천하는 스프레드 타입",
  "reason": "추천 이유"
}
`;

    try {
      let response: string;

      if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
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

    if (lowerQ.includes('오늘') || lowerQ.includes('지금') || lowerQ.length < 20) {
      return {
        analysis: '간단하고 즉각적인 답이 필요한 질문입니다.',
        recommendedSpread: 'one-card',
        reason: '간결한 답변이 필요한 질문이므로 원 카드 스프레드가 적합합니다.'
      };
    }

    if (lowerQ.includes('미래') || lowerQ.includes('앞으로') || lowerQ.includes('과거')) {
      return {
        analysis: '시간의 흐름을 보는 질문입니다.',
        recommendedSpread: 'three-card',
        reason: '과거-현재-미래의 흐름을 보기에 적합한 쓰리 카드 스프레드를 추천합니다.'
      };
    }

    if (lowerQ.includes('재물') || lowerQ.includes('건강') || lowerQ.includes('오행')) {
      return {
        analysis: '오행과 연관된 질문입니다.',
        recommendedSpread: 'saju-custom',
        reason: '사주의 오행 균형과 연결된 사주 맞춤형 스프레드가 적합합니다.'
      };
    }

    return {
      analysis: '복합적인 상황 분석이 필요한 질문입니다.',
      recommendedSpread: 'celtic-cross',
      reason: '종합적인 분석을 위해 켈트 십자가 스프레드를 추천합니다.'
    };
  }

  // AI 기반 종합 해석
  async generateAdvancedInterpretation(
    sajuAnalysis: SajuAnalysis,
    drawnCards: DrawnCard[],
    spreadType: SpreadType,
    question: string
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

    const prompt = `
당신은 동양 철학과 서양 신비학에 정통한 전문가입니다. 사주 만세력 분석과 타로 카드를 종합하여 깊이 있는 해석을 제공해주세요.

[현재 시점 정보]
${timingInfo}
계절적 특성: ${seasonalElement}

[사용자 정보]
- 일간: ${sajuAnalysis.dayMaster} (${sajuAnalysis.dayMasterElement})
- 강한 오행: ${sajuAnalysis.strongElements.join(', ')}
- 약한 오행: ${sajuAnalysis.weakElements.join(', ')}
- 성격: ${sajuAnalysis.personality}

[사용자 질문]
"${question}"

[뽑힌 타로 카드 (${spreadType})]
${drawnCards.filter(dc => dc.positionMeaning !== '조언 카드').map((dc, i) => `
${i + 1}. ${dc.positionMeaning}: ${dc.card.nameKo} (${dc.card.name})
   - ${dc.isReversed ? '역방향' : '정방향'}
   - 의미: ${dc.isReversed ? dc.card.reversedMeaning : dc.card.uprightMeaning}
   - 오행: ${dc.card.element || '없음'}
`).join('\n')}

${drawnCards.find(dc => dc.positionMeaning === '조언 카드') ? `
[추가 조언 카드]
${(() => {
  const adviceCard = drawnCards.find(dc => dc.positionMeaning === '조언 카드');
  if (!adviceCard) return '';
  return `${adviceCard.card.nameKo} (${adviceCard.card.name}) - ${adviceCard.isReversed ? '역방향' : '정방향'}
   의미: ${adviceCard.isReversed ? adviceCard.card.reversedMeaning : adviceCard.card.uprightMeaning}
   오행: ${adviceCard.card.element || '없음'}`;
})()}
` : ''}

편안하고 친근한 말투로 다음 ${drawnCards.find(dc => dc.positionMeaning === '조언 카드') ? '다섯' : '네'} 부분을 나누어 설명해주세요.

⚠️ 중요한 규칙:
- 마크다운 문법을 절대 사용하지 마세요 (*, **, #, - 등 모두 금지)
- 강조하고 싶은 내용도 일반 텍스트로 작성하세요
- 리스트를 만들 때는 "첫째,", "둘째," 또는 "그리고" 같은 자연스러운 연결어를 사용하세요
- 괄호 () 안에 부가 설명을 넣는 것은 괜찮습니다
각 섹션은 "---" 으로 구분해주세요.

[질문에 대한 결론]
"${question}" 이 질문에 대한 답을 먼저 명확하게 요약해드릴게요. 뽑으신 카드들과 당신의 사주(일간: ${sajuAnalysis.dayMaster})를 종합해보면, 이 상황에 대한 답은 한마디로 이렇습니다. 긍정적이든 부정적이든 솔직하게 핵심만 먼저 이야기해주세요. (150~200자)

---

[각 타로 카드의 상세 해석]
이제 뽑으신 카드들을 하나씩 자세히 살펴볼게요. 당신은 ${sajuAnalysis.dayMaster}(${sajuAnalysis.dayMasterElement})일간이고, ${sajuAnalysis.strongElements.join(', ')} 기운이 강하며 ${sajuAnalysis.weakElements.join(', ')} 기운이 약한 사주를 가지고 계세요.

${drawnCards.filter(dc => dc.positionMeaning !== '조언 카드').map((dc, i) => {
  const direction = dc.isReversed ? '역방향' : '정방향';
  const meaning = dc.isReversed ? dc.card.reversedMeaning : dc.card.uprightMeaning;
  const keywords = dc.isReversed ? dc.card.reversedKeywords.join(', ') : dc.card.uprightKeywords.join(', ');
  return `
${i + 1}번째 카드: ${dc.positionMeaning} - ${dc.card.nameKo} (${direction})

먼저 이 카드의 의미는 "${meaning}"이에요. 키워드로는 ${keywords} 같은 것들이 있습니다.

${dc.card.nameKo} 카드의 그림을 자세히 보면 어떤 상징들이 그려져 있는지 설명하고, 그 상징들이 각각 무엇을 의미하는지 구체적으로 풀어주세요. 예를 들어 특정 인물, 사물, 배경, 색상 등이 어떤 메시지를 담고 있는지 이야기해주세요.

이 카드가 ${dc.positionMeaning} 자리에 나왔다는 것은 중요한 의미가 있어요. 당신의 ${sajuAnalysis.dayMasterElement} 일간과 연결해서 생각해보면, ${dc.card.element ? `이 카드의 ${dc.card.element} 기운이 당신 사주의 ${sajuAnalysis.strongElements.includes(dc.card.element) ? `강한 ${dc.card.element} 기운과 만나 더욱 증폭되는` : sajuAnalysis.weakElements.includes(dc.card.element) ? `약한 ${dc.card.element} 기운을 보완해주는` : `${dc.card.element} 기운과 조화를 이루는`} 형태로 작용하고 있어요. ` : ''}
카드의 메시지와 당신의 사주 오행이 어떻게 상호작용하여 당신의 현재 상황이나 미래에 영향을 미치는지 구체적으로 설명해주세요.

실제로 이 카드가 당신에게 전하는 메시지는, 일상생활에서 어떻게 받아들이고 행동해야 하는지까지 포함해서 알려주세요. (각 카드당 250자 이상)
`;
}).join('\n')}

위에서 설명한 모든 카드들을 종합해서, 전체적인 흐름과 당신의 사주가 만나면서 만들어지는 하나의 큰 이야기를 자연스럽게 이어서 설명해주세요. 각 카드가 서로 어떻게 연결되고, 당신의 만세력과 어울려 어떤 전체적인 그림을 그리는지 보여주세요. (250자 이상)

---

[오행의 흐름과 현재 시기]
지금 ${dateContext.season}이고 절기로는 ${dateContext.jieqi} 시기라 ${seasonalElement} 기운이 흐르고 있어요. 이 계절의 에너지가 당신의 사주와 만나면서, 그리고 뽑은 타로 카드들의 오행과 어울려서 지금 어떤 흐름이 만들어지고 있는지 쉽게 설명해주세요. (250자 이상)

---

[실천할 수 있는 조언]
${dateContext.month}월인 지금, 당신의 ${sajuAnalysis.dayMasterElement} 일간과 뽑은 카드들의 메시지를 토대로 실제로 해볼 수 있는 구체적인 방법들을 알려드릴게요. 당신의 강한 오행(${sajuAnalysis.strongElements.join(', ')})을 활용하고 약한 오행(${sajuAnalysis.weakElements.join(', ')})을 보완하는 실천 방법을 포함해서, 일상에서 바로 시도해볼 수 있는 것들로 알려주세요. (250자 이상)

${drawnCards.find(dc => dc.positionMeaning === '조언 카드') ? '\n---\n\n[조언 카드의 메시지]\n특별히 뽑으신 조언 카드가 지금 이 시기에 꼭 전하고 싶은 이야기가 있어요. 카드가 건네는 따뜻한 조언을 들어보세요. (150자 이상)' : ''}
`;

    try {
      let response: string;

      if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
      } else if (this.claude) {
        const message = await this.claude.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [{ role: 'user', content: prompt }]
        });
        response = message.content[0].type === 'text' ? message.content[0].text : '';
      } else {
        throw new Error('AI 서비스를 사용할 수 없습니다.');
      }

      // 응답 파싱
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('AI 해석 생성 오류:', error);
      throw new Error('AI 해석을 생성하는 중 오류가 발생했습니다.');
    }
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
    chatHistory: Array<{ role: string; content: string }>
  ): Promise<string> {
    const prompt = `당신은 타로와 사주 만세력에 정통한 친절한 상담사입니다.

[사용자의 사주 정보]
${reading.sajuAnalysis ? `
- 일간: ${reading.sajuAnalysis.dayMaster} (${reading.sajuAnalysis.dayMasterElement})
- 강한 오행: ${reading.sajuAnalysis.strongElements?.join(', ') || '정보 없음'}
- 약한 오행: ${reading.sajuAnalysis.weakElements?.join(', ') || '정보 없음'}
- 성격 특성: ${reading.sajuAnalysis.personality || '정보 없음'}
` : '사주 정보 없음'}

[타로 리딩 결과]
- 원래 질문: ${reading.question || '없음'}
- 뽑은 카드: ${reading.drawnCards?.map((dc: any) => `${dc.card.nameKo} (${dc.isReversed ? '역방향' : '정방향'}, ${dc.card.element || ''})`).join(', ')}
- 종합 해석: ${reading.integrated || '정보 없음'}
- 오행의 흐름: ${reading.elementalHarmony || '정보 없음'}
- 실천 조언: ${reading.personalizedAdvice || '정보 없음'}

[이전 대화]
${chatHistory.slice(-3).map(msg => `${msg.role === 'user' ? '사용자' : '상담사'}: ${msg.content}`).join('\n')}

[현재 질문]
${question}

⚠️ 중요한 답변 규칙:
- 마크다운 문법을 절대 사용하지 마세요 (*, **, #, - 등 모두 금지)
- 편안하고 친근한 "~해요", "~이에요" 말투 사용
- 사용자의 사주와 타로 결과를 함께 고려해서 답변하세요
- 구체적이고 실천 가능한 조언 제공
- 답변은 250자 내외로 작성
- 질문이 관련 없으면 부드럽게 리딩과 연결해서 답변하세요
- 새로운 통찰이나 구체적인 예시를 들어주세요`;

    try {
      let response: string;

      if (this.gemini) {
        const model = this.gemini.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const result = await model.generateContent(prompt);
        response = result.response.text();
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

      return response.trim();
    } catch (error) {
      console.error('Chat AI 오류:', error);
      throw new Error('답변 생성 중 오류가 발생했습니다.');
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
