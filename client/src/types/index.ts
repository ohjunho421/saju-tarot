// 사주 관련 타입
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour?: number; // 선택사항 - 모르는 경우 시주 제외
  isLunar: boolean;
  gender: 'male' | 'female';
}

export type Element = '목' | '화' | '토' | '금' | '수';

export interface SajuPillar {
  heavenlyStem: string;
  earthlyBranch: string;
  element: Element;
}

export interface SajuChart {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour?: SajuPillar; // 선택사항 - 시간을 모르는 경우 없을 수 있음
}

export interface ElementBalance {
  목: number;
  화: number;
  토: number;
  금: number;
  수: number;
}

export interface SajuAnalysis {
  birthInfo: BirthInfo;
  chart: SajuChart;
  elementBalance: ElementBalance;
  dayMaster: string;
  dayMasterElement: Element;
  strongElements: Element[];
  weakElements: Element[];
  personality: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

// 타로 관련 타입
export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type SpreadType = 'one-card' | 'three-card' | 'celtic-cross' | 'saju-custom';

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

// 통합 리딩 타입
export interface IntegratedReading {
  sajuAnalysis: SajuAnalysis;
  drawnCards: DrawnCard[];
  spreadType: SpreadType;
  question?: string;
  integrated: string;
  elementalHarmony: string;
  personalizedAdvice: string;
  adviceCardInterpretation?: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
