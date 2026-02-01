// 결제 및 포인트 설정

// 스프레드별 필요 포인트 (카드 수 * 1000원)
export const SPREAD_POINTS: Record<string, number> = {
  'one-card': 1000,      // 1카드 = 1,000원
  'three-card': 3000,    // 3카드 = 3,000원
  'five-card': 5000,     // 5카드 = 5,000원
  'celtic-cross': 10000, // 켈틱크로스(10카드) = 10,000원
  'saju-custom': 5000,   // 사주 커스텀 = 5,000원
};

// 포인트 충전 상품 (레몬스퀴지 variant ID와 매핑)
export const POINT_PACKAGES = [
  {
    id: 'basic',
    name: '기본 패키지',
    points: 5000,
    price: 5000,
    description: '5,000 포인트 (5카드 1회)',
    bonus: 0,
  },
  {
    id: 'standard',
    name: '스탠다드 패키지',
    points: 10000,
    price: 10000,
    description: '10,000 포인트 (켈틱크로스 1회)',
    bonus: 0,
  },
  {
    id: 'premium',
    name: '프리미엄 패키지',
    points: 30000,
    price: 27000,
    description: '30,000 포인트 (10% 보너스)',
    bonus: 3000,
  },
  {
    id: 'vip',
    name: 'VIP 패키지',
    points: 50000,
    price: 42500,
    description: '50,000 포인트 (15% 보너스)',
    bonus: 7500,
  },
];

// 스프레드 타입에서 카드 수 계산
export function getCardCountFromSpread(spreadType: string): number {
  switch (spreadType) {
    case 'one-card':
      return 1;
    case 'three-card':
      return 3;
    case 'five-card':
      return 5;
    case 'celtic-cross':
      return 10;
    case 'saju-custom':
      return 5;
    default:
      return 3;
  }
}

// 스프레드 타입에서 필요 포인트 계산
export function getRequiredPoints(spreadType: string): number {
  return SPREAD_POINTS[spreadType] || 3000;
}
