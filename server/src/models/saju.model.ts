// 천간 (Heavenly Stems)
export const HEAVENLY_STEMS = {
  '갑': { element: '목', yinYang: '양', index: 0 },
  '을': { element: '목', yinYang: '음', index: 1 },
  '병': { element: '화', yinYang: '양', index: 2 },
  '정': { element: '화', yinYang: '음', index: 3 },
  '무': { element: '토', yinYang: '양', index: 4 },
  '기': { element: '토', yinYang: '음', index: 5 },
  '경': { element: '금', yinYang: '양', index: 6 },
  '신': { element: '금', yinYang: '음', index: 7 },
  '임': { element: '수', yinYang: '양', index: 8 },
  '계': { element: '수', yinYang: '음', index: 9 }
} as const;

// 지지 (Earthly Branches)
export const EARTHLY_BRANCHES = {
  '자': { element: '수', animal: '쥐', index: 0 },
  '축': { element: '토', animal: '소', index: 1 },
  '인': { element: '목', animal: '호랑이', index: 2 },
  '묘': { element: '목', animal: '토끼', index: 3 },
  '진': { element: '토', animal: '용', index: 4 },
  '사': { element: '화', animal: '뱀', index: 5 },
  '오': { element: '화', animal: '말', index: 6 },
  '미': { element: '토', animal: '양', index: 7 },
  '신': { element: '금', animal: '원숭이', index: 8 },
  '유': { element: '금', animal: '닭', index: 9 },
  '술': { element: '토', animal: '개', index: 10 },
  '해': { element: '수', animal: '돼지', index: 11 }
} as const;

// 오행 (Five Elements)
export type Element = '목' | '화' | '토' | '금' | '수';

export const ELEMENT_RELATIONS = {
  '목': { generates: '화', controls: '토', controlledBy: '금' },
  '화': { generates: '토', controls: '금', controlledBy: '수' },
  '토': { generates: '금', controls: '수', controlledBy: '목' },
  '금': { generates: '수', controls: '목', controlledBy: '화' },
  '수': { generates: '목', controls: '화', controlledBy: '토' }
};

// 십신 (Ten Gods)
export const TEN_GODS = [
  '비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인'
];

export interface BirthInfo {
  year: number;
  month: number;
  day: number;
  hour: number;
  isLunar: boolean;
  gender: 'male' | 'female';
}

export interface SajuPillar {
  heavenlyStem: string;
  earthlyBranch: string;
  element: Element;
}

export interface SajuChart {
  year: SajuPillar;
  month: SajuPillar;
  day: SajuPillar;
  hour: SajuPillar;
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
