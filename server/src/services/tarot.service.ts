import { TarotCard, DrawnCard, SpreadType, TarotReading, SPREAD_POSITIONS } from '../models/tarot.model';
import { TAROT_CARDS } from '../data/tarot-cards';
import { getTarotCardImageUrl } from '../utils/tarot-image-mapper';

export class TarotService {
  private allCards: TarotCard[];

  constructor() {
    // 모든 카드에 이미지 URL 추가
    this.allCards = TAROT_CARDS.map(card => ({
      ...card,
      imageUrl: getTarotCardImageUrl(card.name)
    }));
  }

  // 카드 셔플
  private shuffleDeck(): TarotCard[] {
    const shuffled = [...this.allCards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // 카드 뽑기
  public drawCards(spreadType: SpreadType, question?: string, includeAdviceCard: boolean = false, cardPositions?: number[]): DrawnCard[] {
    const positions = SPREAD_POSITIONS[spreadType];
    
    // 사용자가 선택한 카드 인덱스가 제공된 경우
    if (cardPositions && cardPositions.length > 0) {
      const drawnCards: DrawnCard[] = [];
      
      for (let i = 0; i < positions.length; i++) {
        const cardIndex = cardPositions[i];
        const card = this.allCards[cardIndex];
        const isReversed = Math.random() < 0.3; // 30% 확률로 역방향
        
        drawnCards.push({
          card,
          position: i,
          isReversed,
          positionMeaning: positions[i]
        });
      }
      
      return drawnCards;
    }
    
    // 기존 랜덤 로직
    const shuffledDeck = this.shuffleDeck();
    const drawnCards: DrawnCard[] = [];

    for (let i = 0; i < positions.length; i++) {
      const card = shuffledDeck[i];
      const isReversed = Math.random() < 0.3; // 30% 확률로 역방향
      
      drawnCards.push({
        card,
        position: i,
        isReversed,
        positionMeaning: positions[i]
      });
    }

    // 조언 카드 추가
    if (includeAdviceCard) {
      const adviceCard = shuffledDeck[positions.length];
      const isReversed = Math.random() < 0.3;
      
      drawnCards.push({
        card: adviceCard,
        position: positions.length,
        isReversed,
        positionMeaning: '조언 카드'
      });
    }

    return drawnCards;
  }

  // 기본 타로 해석 생성 (템플릿 기반)
  public generateBasicInterpretation(drawnCards: DrawnCard[], spreadType: SpreadType): string {
    let interpretation = '';

    drawnCards.forEach(({ card, position, isReversed, positionMeaning }) => {
      const meaning = isReversed ? card.reversedMeaning : card.uprightMeaning;
      const keywords = isReversed ? card.reversedKeywords : card.uprightKeywords;
      const direction = isReversed ? '역방향' : '정방향';

      interpretation += `\n[${positionMeaning}] ${card.nameKo} (${card.name}) - ${direction}\n`;
      interpretation += `의미: ${meaning}\n`;
      interpretation += `키워드: ${keywords.join(', ')}\n`;
    });

    return interpretation;
  }

  // 조언 생성
  public generateAdvice(drawnCards: DrawnCard[]): string {
    const positiveCards = drawnCards.filter(dc => !dc.isReversed);
    const negativeCards = drawnCards.filter(dc => dc.isReversed);

    let advice = '';

    if (positiveCards.length > negativeCards.length) {
      advice = '전반적으로 긍정적인 흐름이 보입니다. ';
      advice += '현재의 방향을 유지하되, 과신하지 않도록 주의하세요.';
    } else if (negativeCards.length > positiveCards.length) {
      advice = '주의가 필요한 시기입니다. ';
      advice += '현재 상황을 재점검하고, 필요하다면 방향을 전환하세요.';
    } else {
      advice = '균형을 유지하는 것이 중요합니다. ';
      advice += '긍정적 측면과 부정적 측면을 모두 고려하여 행동하세요.';
    }

    return advice;
  }

  // ID로 카드 찾기
  public getCardById(id: string): TarotCard | undefined {
    return this.allCards.find(card => card.id === id);
  }

  // 모든 카드 가져오기
  public getAllCards(): TarotCard[] {
    return this.allCards;
  }
}
