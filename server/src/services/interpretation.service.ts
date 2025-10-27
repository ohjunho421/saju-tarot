import { SajuAnalysis, Element, ELEMENT_RELATIONS } from '../models/saju.model';
import { DrawnCard, SpreadType } from '../models/tarot.model';

export class InterpretationService {
  // 사주와 타로를 통합 해석
  public integrateInterpretation(
    sajuAnalysis: SajuAnalysis,
    drawnCards: DrawnCard[],
    spreadType: SpreadType
  ): {
    integrated: string;
    elementalHarmony: string;
    personalizedAdvice: string;
  } {
    const elementalAnalysis = this.analyzeElementalConnection(sajuAnalysis, drawnCards);
    const integrated = this.generateIntegratedReading(sajuAnalysis, drawnCards, spreadType, elementalAnalysis);
    const personalizedAdvice = this.generatePersonalizedAdvice(sajuAnalysis, drawnCards, elementalAnalysis);

    return {
      integrated,
      elementalHarmony: elementalAnalysis,
      personalizedAdvice
    };
  }

  // 오행과 타로 카드의 연결 분석
  private analyzeElementalConnection(sajuAnalysis: SajuAnalysis, drawnCards: DrawnCard[]): string {
    const { dayMasterElement, strongElements, weakElements } = sajuAnalysis;
    let analysis = `당신의 일간(日干)은 ${dayMasterElement} 기운입니다.\n\n`;

    // 뽑힌 카드의 오행 분포
    const cardElements: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
    drawnCards.forEach(dc => {
      if (dc.card.element) {
        cardElements[dc.card.element]++;
      }
    });

    // 카드의 오행과 사주 오행 비교
    strongElements.forEach(element => {
      if (cardElements[element] > 0) {
        analysis += `✓ 강한 ${element} 기운이 타로에서도 나타났습니다. `;
        analysis += `이는 현재 당신의 에너지가 조화롭게 흐르고 있음을 의미합니다.\n`;
      }
    });

    weakElements.forEach(element => {
      if (cardElements[element] > 0) {
        analysis += `⚠ 약한 ${element} 기운이 타로에 나타났습니다. `;
        analysis += `이는 보완이 필요한 부분에 주목할 시기임을 나타냅니다.\n`;
      }
    });

    // 오행 상생상극 분석
    const dayMasterRelation = ELEMENT_RELATIONS[dayMasterElement];
    const generatingElement = dayMasterRelation.generates;
    const controlledElement = dayMasterRelation.controls;

    if (cardElements[generatingElement as Element] > 0) {
      analysis += `\n📈 ${generatingElement} 기운의 카드는 당신의 ${dayMasterElement} 기운을 생성(生)합니다. `;
      analysis += `이는 에너지가 충전되고 성장할 시기임을 의미합니다.\n`;
    }

    if (cardElements[controlledElement as Element] > 0) {
      analysis += `\n⚔️ ${controlledElement} 기운의 카드가 나타났습니다. `;
      analysis += `당신의 ${dayMasterElement} 기운이 이를 극(克)하므로, 장애물을 극복할 힘이 있습니다.\n`;
    }

    return analysis;
  }

  // 통합 리딩 생성
  private generateIntegratedReading(
    sajuAnalysis: SajuAnalysis,
    drawnCards: DrawnCard[],
    spreadType: SpreadType,
    elementalAnalysis: string
  ): string {
    let reading = `=== 사주 만세력 기반 타로 통합 해석 ===\n\n`;
    
    // 사주 기본 정보
    reading += `[사주 분석]\n`;
    reading += `일간: ${sajuAnalysis.dayMaster} (${sajuAnalysis.dayMasterElement})\n`;
    reading += `성격: ${sajuAnalysis.personality}\n`;
    reading += `강한 오행: ${sajuAnalysis.strongElements.join(', ')}\n`;
    reading += `약한 오행: ${sajuAnalysis.weakElements.join(', ')}\n\n`;

    // 타로 카드 해석
    reading += `[타로 리딩 - ${spreadType}]\n`;
    drawnCards.forEach(({ card, positionMeaning, isReversed }) => {
      const meaning = isReversed ? card.reversedMeaning : card.uprightMeaning;
      const direction = isReversed ? '역방향' : '정방향';
      reading += `${positionMeaning}: ${card.nameKo} (${direction})\n`;
      reading += `  → ${meaning}\n`;
      if (card.element) {
        reading += `  오행: ${card.element}\n`;
      }
    });

    // 통합 분석
    reading += `\n[오행 조화 분석]\n${elementalAnalysis}\n`;

    return reading;
  }

  // 개인화된 조언 생성
  private generatePersonalizedAdvice(
    sajuAnalysis: SajuAnalysis,
    drawnCards: DrawnCard[],
    elementalAnalysis: string
  ): string {
    let advice = `[맞춤 조언]\n\n`;

    // 사주 기반 조언
    advice += `사주 관점:\n`;
    sajuAnalysis.recommendations.forEach((rec, idx) => {
      advice += `${idx + 1}. ${rec}\n`;
    });

    // 타로 기반 조언
    const reversedCount = drawnCards.filter(dc => dc.isReversed).length;
    const totalCards = drawnCards.length;

    advice += `\n타로 관점:\n`;
    if (reversedCount > totalCards / 2) {
      advice += `• 현재 많은 카드가 역방향으로 나타났습니다. 내면을 돌아보고 재정비할 시간입니다.\n`;
    } else {
      advice += `• 대체로 긍정적인 흐름이 보입니다. 현재의 방향을 유지하세요.\n`;
    }

    // 오행 균형 조언
    advice += `\n오행 균형:\n`;
    const weakElements = sajuAnalysis.weakElements;
    if (weakElements.length > 0) {
      advice += `• 부족한 ${weakElements.join(', ')} 기운을 보완하는 활동을 추천합니다.\n`;
      weakElements.forEach(element => {
        advice += this.getElementalRecommendation(element);
      });
    }

    return advice;
  }

  // 오행별 추천 활동
  private getElementalRecommendation(element: Element): string {
    const recommendations: Record<Element, string> = {
      목: `  - 목(木): 산책, 식물 키우기, 독서, 창의적 활동\n`,
      화: `  - 화(火): 운동, 사교 활동, 예술 감상, 열정적인 취미\n`,
      토: `  - 토(土): 명상, 정리정돈, 안정적인 루틴, 건강한 식습관\n`,
      금: `  - 금(金): 체계적 계획, 논리적 학습, 금융 관리, 금속 공예\n`,
      수: `  - 수(水): 수영, 목욕, 성찰 일기, 지혜로운 조언 구하기\n`
    };
    return recommendations[element];
  }

  // AI를 활용한 고급 해석 (향후 구현)
  public async generateAIInterpretation(
    sajuAnalysis: SajuAnalysis,
    drawnCards: DrawnCard[],
    question?: string
  ): Promise<string> {
    // TODO: OpenAI API 연동
    // 사주 데이터와 타로 카드를 프롬프트로 전달하여 AI 해석 생성
    return '(AI 해석 기능은 향후 구현 예정입니다)';
  }
}
