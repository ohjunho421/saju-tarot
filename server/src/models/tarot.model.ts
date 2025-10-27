import { Element } from './saju.model';

export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';

// 타로 슈트와 오행 매칭
export const SUIT_TO_ELEMENT: Record<TarotSuit, Element | null> = {
  major: null, // 메이저 아르카나는 복합적
  wands: '목', // 지팡이 = 목(木)
  cups: '화', // 컵 = 화(火) - 감정, 열정
  swords: '금', // 검 = 금(金)
  pentacles: '토' // 펜타클 = 토(土)
};

export interface TarotCard {
  id: string;
  name: string;
  nameKo: string;
  number: number;
  suit: TarotSuit;
  element: Element | null;
  uprightMeaning: string;
  reversedMeaning: string;
  uprightKeywords: string[];
  reversedKeywords: string[];
  description: string;
  imageUrl?: string;
}

export interface DrawnCard {
  card: TarotCard;
  position: number;
  isReversed: boolean;
  positionMeaning: string;
}

export type SpreadType = 'one-card' | 'three-card' | 'celtic-cross' | 'saju-custom';

export interface TarotReading {
  id: string;
  spreadType: SpreadType;
  question?: string;
  drawnCards: DrawnCard[];
  interpretation: string;
  advice: string;
  createdAt: Date;
}

// 스프레드 포지션 정의
export const SPREAD_POSITIONS: Record<SpreadType, string[]> = {
  'one-card': ['현재 상황'],
  'three-card': ['과거', '현재', '미래'],
  'celtic-cross': [
    '현재 상황',
    '장애물/도전',
    '의식적 목표',
    '무의식적 영향',
    '과거',
    '가까운 미래',
    '자신의 태도',
    '외부 영향',
    '희망과 두려움',
    '최종 결과'
  ],
  'saju-custom': ['목(木) 기운', '화(火) 기운', '토(土) 기운', '금(金) 기운', '수(水) 기운']
};
