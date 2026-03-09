// 사주 관련 타입
export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour?: number; // 선택사항 - 모르는 경우 시주 제외
  isLunar: boolean;
  isLeapMonth?: boolean; // 윤달 여부 (음력일 때만 해당)
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

// 살(煞) 관련 타입
export type SalType =
  | '도화살' | '역마살' | '화개살' | '겁살' | '망신살' | '백호살' | '천을귀인' | '귀문관살' | '양인살'
  | '장성살' | '반안살' | '천살' | '지살' | '년살' | '월살' | '재살' | '육해살'
  | '천덕귀인' | '월덕귀인' | '문창귀인' | '학당귀인'
  | '원진살' | '공망';

export interface SalInfo {
  name: SalType;
  description: string;
  effect: string;
  isPositive: boolean;
  location: string;
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
  sal?: SalInfo[];
}

// 타로 관련 타입
export type TarotSuit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type SpreadType = 'one-card' | 'two-card' | 'three-card' | 'celtic-cross' | 'saju-custom' | 'six-months' | 'yes-no' | 'problem-solution' | 'compatibility' | 'daily-fortune';

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
  readingId: string;
  sajuAnalysis: SajuAnalysis;
  drawnCards: DrawnCard[];
  spreadType: SpreadType;
  question: string;
  interpretation: string;
  elementalHarmony: string;
  personalizedAdvice: string;
  adviceCardInterpretation?: string;
  compatibilityReading?: string; // 궁합 분석 결과
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// MBTI 타입
export type MBTIType = 
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export const MBTI_TYPES: MBTIType[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

export const MBTI_DESCRIPTIONS: Record<MBTIType, { name: string; emoji: string }> = {
  'INTJ': { name: '전략가', emoji: '🧠' },
  'INTP': { name: '논리술사', emoji: '🔬' },
  'ENTJ': { name: '통솔자', emoji: '👑' },
  'ENTP': { name: '변론가', emoji: '💡' },
  'INFJ': { name: '옹호자', emoji: '🌟' },
  'INFP': { name: '중재자', emoji: '🦋' },
  'ENFJ': { name: '선도자', emoji: '🌈' },
  'ENFP': { name: '활동가', emoji: '🎭' },
  'ISTJ': { name: '현실주의자', emoji: '📋' },
  'ISFJ': { name: '수호자', emoji: '🛡️' },
  'ESTJ': { name: '경영자', emoji: '📊' },
  'ESFJ': { name: '집정관', emoji: '🤝' },
  'ISTP': { name: '장인', emoji: '🔧' },
  'ISFP': { name: '모험가', emoji: '🎨' },
  'ESTP': { name: '사업가', emoji: '🚀' },
  'ESFP': { name: '연예인', emoji: '🎉' }
};
