import type { BirthInfo } from '../models/saju.model';

export type ZodiacSign =
  | '양자리' | '황소자리' | '쌍둥이자리' | '게자리'
  | '사자자리' | '처녀자리' | '천칭자리' | '전갈자리'
  | '사수자리' | '염소자리' | '물병자리' | '물고기자리';

export interface ZodiacInfo {
  sign: ZodiacSign;
  signEnglish: string;
  symbol: string;
  element: string;       // 서양 4원소: 불, 흙, 바람, 물
  quality: string;       // 활동궁, 고정궁, 변통궁
  rulingPlanet: string;
  dateRange: string;
  personality: string;
  strengths: string[];
  weaknesses: string[];
  compatibility: ZodiacSign[];  // 궁합 좋은 별자리
}

const ZODIAC_DATA: Record<ZodiacSign, Omit<ZodiacInfo, 'sign'>> = {
  '양자리': {
    signEnglish: 'Aries',
    symbol: '♈',
    element: '불',
    quality: '활동궁',
    rulingPlanet: '화성',
    dateRange: '3/21 ~ 4/19',
    personality: '용감하고 열정적이며 자신감이 넘칩니다. 새로운 도전을 두려워하지 않고, 리더십이 강합니다.',
    strengths: ['용기', '결단력', '자신감', '열정', '정직함'],
    weaknesses: ['충동적', '참을성 부족', '공격적', '기분 변화'],
    compatibility: ['사자자리', '사수자리', '쌍둥이자리', '물병자리']
  },
  '황소자리': {
    signEnglish: 'Taurus',
    symbol: '♉',
    element: '흙',
    quality: '고정궁',
    rulingPlanet: '금성',
    dateRange: '4/20 ~ 5/20',
    personality: '안정적이고 인내심이 강하며 감각적입니다. 물질적 안정을 중시하고 한번 정한 것은 끝까지 합니다.',
    strengths: ['인내심', '신뢰성', '실용적', '헌신적', '책임감'],
    weaknesses: ['완고함', '소유욕', '타협 부족', '변화 거부'],
    compatibility: ['처녀자리', '염소자리', '게자리', '물고기자리']
  },
  '쌍둥이자리': {
    signEnglish: 'Gemini',
    symbol: '♊',
    element: '바람',
    quality: '변통궁',
    rulingPlanet: '수성',
    dateRange: '5/21 ~ 6/20',
    personality: '재치 있고 호기심이 많으며 소통 능력이 뛰어납니다. 다재다능하고 새로운 정보를 빠르게 습득합니다.',
    strengths: ['적응력', '소통 능력', '재치', '지적 호기심', '유연함'],
    weaknesses: ['우유부단', '일관성 부족', '신경질적', '피상적'],
    compatibility: ['천칭자리', '물병자리', '양자리', '사자자리']
  },
  '게자리': {
    signEnglish: 'Cancer',
    symbol: '♋',
    element: '물',
    quality: '활동궁',
    rulingPlanet: '달',
    dateRange: '6/21 ~ 7/22',
    personality: '감정이 풍부하고 가족을 소중히 여기며 보호 본능이 강합니다. 직감이 뛰어나고 섬세합니다.',
    strengths: ['공감 능력', '직관력', '보호 본능', '충성심', '상상력'],
    weaknesses: ['감정 기복', '집착', '비관적', '자기 방어적'],
    compatibility: ['전갈자리', '물고기자리', '황소자리', '처녀자리']
  },
  '사자자리': {
    signEnglish: 'Leo',
    symbol: '♌',
    element: '불',
    quality: '고정궁',
    rulingPlanet: '태양',
    dateRange: '7/23 ~ 8/22',
    personality: '당당하고 창의적이며 관대합니다. 무대 위에 서는 것을 좋아하고 자연스러운 리더십을 발휘합니다.',
    strengths: ['창의력', '열정', '관대함', '리더십', '유머감각'],
    weaknesses: ['자존심', '오만함', '자기중심적', '고집'],
    compatibility: ['양자리', '사수자리', '쌍둥이자리', '천칭자리']
  },
  '처녀자리': {
    signEnglish: 'Virgo',
    symbol: '♍',
    element: '흙',
    quality: '변통궁',
    rulingPlanet: '수성',
    dateRange: '8/23 ~ 9/22',
    personality: '분석적이고 꼼꼼하며 실용적입니다. 완벽을 추구하고 남을 돕는 것에서 보람을 느낍니다.',
    strengths: ['분석력', '꼼꼼함', '근면함', '실용적', '봉사 정신'],
    weaknesses: ['지나친 걱정', '완벽주의', '비판적', '소심함'],
    compatibility: ['황소자리', '염소자리', '게자리', '전갈자리']
  },
  '천칭자리': {
    signEnglish: 'Libra',
    symbol: '♎',
    element: '바람',
    quality: '활동궁',
    rulingPlanet: '금성',
    dateRange: '9/23 ~ 10/22',
    personality: '조화와 균형을 추구하며 사교적입니다. 공정함을 중시하고 아름다운 것을 사랑합니다.',
    strengths: ['외교적', '공정함', '사교성', '미적 감각', '협력적'],
    weaknesses: ['우유부단', '갈등 회피', '자기 희생', '의존적'],
    compatibility: ['쌍둥이자리', '물병자리', '사자자리', '사수자리']
  },
  '전갈자리': {
    signEnglish: 'Scorpio',
    symbol: '♏',
    element: '물',
    quality: '고정궁',
    rulingPlanet: '명왕성',
    dateRange: '10/23 ~ 11/21',
    personality: '강렬하고 통찰력이 깊으며 의지가 강합니다. 비밀을 잘 지키고 깊은 유대 관계를 맺습니다.',
    strengths: ['통찰력', '결단력', '집중력', '충성심', '전략적'],
    weaknesses: ['질투심', '집착', '비밀주의', '복수심'],
    compatibility: ['게자리', '물고기자리', '처녀자리', '염소자리']
  },
  '사수자리': {
    signEnglish: 'Sagittarius',
    symbol: '♐',
    element: '불',
    quality: '변통궁',
    rulingPlanet: '목성',
    dateRange: '11/22 ~ 12/21',
    personality: '자유롭고 낙관적이며 모험을 즐깁니다. 철학적 사고를 좋아하고 솔직합니다.',
    strengths: ['낙관주의', '자유로움', '솔직함', '철학적', '유머'],
    weaknesses: ['무책임', '과장', '참을성 부족', '무신경'],
    compatibility: ['양자리', '사자자리', '천칭자리', '물병자리']
  },
  '염소자리': {
    signEnglish: 'Capricorn',
    symbol: '♑',
    element: '흙',
    quality: '활동궁',
    rulingPlanet: '토성',
    dateRange: '12/22 ~ 1/19',
    personality: '야심차고 훈련된 성격으로 목표를 향해 꾸준히 나아갑니다. 책임감이 강하고 현실적입니다.',
    strengths: ['인내심', '야망', '책임감', '자기 관리', '현실적'],
    weaknesses: ['냉정함', '비관적', '완고함', '일 중독'],
    compatibility: ['황소자리', '처녀자리', '전갈자리', '물고기자리']
  },
  '물병자리': {
    signEnglish: 'Aquarius',
    symbol: '♒',
    element: '바람',
    quality: '고정궁',
    rulingPlanet: '천왕성',
    dateRange: '1/20 ~ 2/18',
    personality: '독창적이고 인도주의적이며 진보적입니다. 독립적이고 남다른 시각으로 세상을 봅니다.',
    strengths: ['독창성', '진보적', '인도주의', '독립적', '지적'],
    weaknesses: ['감정 표현 부족', '반항적', '고집', '예측 불가'],
    compatibility: ['쌍둥이자리', '천칭자리', '양자리', '사수자리']
  },
  '물고기자리': {
    signEnglish: 'Pisces',
    symbol: '♓',
    element: '물',
    quality: '변통궁',
    rulingPlanet: '해왕성',
    dateRange: '2/19 ~ 3/20',
    personality: '감수성이 풍부하고 직관적이며 예술적입니다. 공감 능력이 뛰어나고 영적 세계에 관심이 많습니다.',
    strengths: ['공감 능력', '직관력', '예술성', '이타적', '적응력'],
    weaknesses: ['현실 도피', '우유부단', '감정적', '자기 연민'],
    compatibility: ['게자리', '전갈자리', '황소자리', '염소자리']
  }
};

// 서양 4원소와 동양 오행의 상관관계
const ELEMENT_BRIDGE: Record<string, { relatedElements: string[]; description: string }> = {
  '불': {
    relatedElements: ['화'],
    description: '서양의 불 원소는 동양의 화(火) 기운과 통합니다. 열정, 에너지, 변혁의 힘을 공유합니다.'
  },
  '흙': {
    relatedElements: ['토'],
    description: '서양의 흙 원소는 동양의 토(土) 기운과 통합니다. 안정, 실용, 물질적 기반을 공유합니다.'
  },
  '바람': {
    relatedElements: ['목', '금'],
    description: '서양의 바람 원소는 동양의 목(木)의 성장 에너지와 금(金)의 날카로운 사고력을 함께 품고 있습니다.'
  },
  '물': {
    relatedElements: ['수'],
    description: '서양의 물 원소는 동양의 수(水) 기운과 통합니다. 감정, 직관, 내면의 지혜를 공유합니다.'
  }
};

export class ZodiacService {
  /**
   * 생년월일로 별자리를 계산합니다.
   * 음력인 경우 양력으로 변환해서 계산해야 하므로, 양력 month/day를 전달하세요.
   */
  static getZodiacSign(month: number, day: number): ZodiacSign {
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return '양자리';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return '황소자리';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return '쌍둥이자리';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return '게자리';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return '사자자리';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return '처녀자리';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return '천칭자리';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return '전갈자리';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return '사수자리';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return '염소자리';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return '물병자리';
    return '물고기자리'; // 2/19 ~ 3/20
  }

  /**
   * BirthInfo에서 별자리 정보를 계산합니다.
   * 음력인 경우 양력 변환 후 계산합니다.
   */
  static getZodiacFromBirthInfo(birthInfo: BirthInfo): ZodiacInfo {
    let solarMonth = birthInfo.month;
    let solarDay = birthInfo.day;

    if (birthInfo.isLunar) {
      // 음력 → 양력 변환 (lunar-javascript 사용)
      try {
        const { Lunar } = require('lunar-javascript');
        const lunar = Lunar.fromYmd(birthInfo.year, birthInfo.month, birthInfo.day);
        const solar = lunar.getSolar();
        solarMonth = solar.getMonth();
        solarDay = solar.getDay();
      } catch {
        // 변환 실패 시 양력으로 간주
        solarMonth = birthInfo.month;
        solarDay = birthInfo.day;
      }
    }

    const sign = ZodiacService.getZodiacSign(solarMonth, solarDay);
    return { sign, ...ZODIAC_DATA[sign] };
  }

  /**
   * 별자리 정보를 가져옵니다.
   */
  static getZodiacInfo(sign: ZodiacSign): ZodiacInfo {
    return { sign, ...ZODIAC_DATA[sign] };
  }

  /**
   * 서양 별자리 원소와 동양 오행의 연결 분석
   */
  static getElementBridge(zodiacElement: string, sajuDayMasterElement: string): string {
    const bridge = ELEMENT_BRIDGE[zodiacElement];
    if (!bridge) return '';

    const isRelated = bridge.relatedElements.includes(sajuDayMasterElement);
    if (isRelated) {
      return `${bridge.description} 사주의 일간(${sajuDayMasterElement})과 별자리 원소(${zodiacElement})가 같은 계열이므로, 해당 기운이 더욱 강화됩니다.`;
    }
    return `${bridge.description} 사주의 일간(${sajuDayMasterElement})과 별자리 원소(${zodiacElement})는 서로 다른 계열로, 다양한 에너지가 조화를 이루고 있습니다.`;
  }

  /**
   * AI 프롬프트에 포함할 별자리 요약 텍스트를 생성합니다.
   */
  static getZodiacSummaryForPrompt(zodiacInfo: ZodiacInfo, sajuDayMasterElement: string): string {
    const bridge = this.getElementBridge(zodiacInfo.element, sajuDayMasterElement);
    return `[별자리] ${zodiacInfo.symbol} ${zodiacInfo.sign}(${zodiacInfo.signEnglish}) - ${zodiacInfo.element} 원소, ${zodiacInfo.quality}
성격: ${zodiacInfo.personality}
강점: ${zodiacInfo.strengths.join(', ')} / 약점: ${zodiacInfo.weaknesses.join(', ')}
동서양 원소 연결: ${bridge}`;
  }
}
