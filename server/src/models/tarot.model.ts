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

export type SpreadType = 'one-card' | 'two-card' | 'three-card' | 'celtic-cross' | 'saju-custom' | 'six-months' | 'yes-no' | 'problem-solution' | 'compatibility';

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
  'two-card': ['선택지 A', '선택지 B'],  // A vs B 비교용
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
  'saju-custom': ['목(木) 기운', '화(火) 기운', '토(土) 기운', '금(金) 기운', '수(水) 기운'],
  'six-months': ['이번 달', '다음 달', '2개월 후', '3개월 후', '4개월 후', '5개월 후'],
  'yes-no': ['답변'],  // 간단한 예/아니오 질문용
  'problem-solution': ['문제의 원인', '해결책'],  // 문제-해결 구조
  'compatibility': ['나의 기운', '상대방의 기운', '두 사람의 관계', '앞으로의 흐름']  // 궁합 전용
};

// 스프레드 설명 (AI 추천 시 사용)
export const SPREAD_DESCRIPTIONS: Record<SpreadType, { name: string; description: string; bestFor: string }> = {
  'one-card': {
    name: '원 카드',
    description: '한 장의 카드로 핵심 메시지를 전달',
    bestFor: '오늘의 운세, 간단한 조언, 현재 에너지 확인'
  },
  'two-card': {
    name: '투 카드 (A vs B)',
    description: '두 장의 카드로 두 가지 선택지를 비교',
    bestFor: 'A와 B 중 선택, 두 가지 옵션 비교, 양자택일 고민'
  },
  'three-card': {
    name: '쓰리 카드',
    description: '세 장으로 상황의 흐름을 파악',
    bestFor: '과거-현재-미래 흐름, 상황 분석, 결정의 결과 예측'
  },
  'celtic-cross': {
    name: '켈틱 크로스',
    description: '열 장으로 복잡한 상황을 깊이 분석',
    bestFor: '복잡한 관계, 인생의 큰 결정, 종합적 상황 파악'
  },
  'saju-custom': {
    name: '사주 오행',
    description: '다섯 장으로 오행 에너지와 연결',
    bestFor: '타고난 기운 분석, 오행 균형, 본질적 운세'
  },
  'six-months': {
    name: '6개월 흐름',
    description: '여섯 장으로 월별 흐름을 조망',
    bestFor: '장기적 계획, 시기별 운세, 변화의 타이밍'
  },
  'yes-no': {
    name: '예/아니오',
    description: '한 장으로 명확한 답변 제시',
    bestFor: '단순한 예/아니오 질문, 직관적 판단'
  },
  'problem-solution': {
    name: '문제-해결',
    description: '두 장으로 문제의 원인과 해결책 제시',
    bestFor: '현재 어려움의 원인 파악, 구체적 해결 방안'
  },
  'compatibility': {
    name: '궁합 리딩',
    description: '네 장으로 두 사람의 에너지와 관계 흐름 분석',
    bestFor: '연인/배우자 궁합, 이성 관계 탐색, 두 사람의 미래'
  }
};
