/**
 * 리딩 가격표와 충전 단위 — 서버가 유일한 기준이다.
 * 화면은 GET /api/points/prices 로 받아서 보여 준다(화면에 가격을 따로 적어 두지 않는다).
 * 1포인트 = 1원.
 *
 * 가격을 바꾸면 docs/features/point-system.md 의 가격표도 같이 고친다.
 */
import type { SpreadType } from '../models/tarot.model';

/** 가입 시(그리고 유료 전환 시점의 기존 회원에게) 한 번 지급하는 포인트 */
export const SIGNUP_BONUS_POINTS = 1000;

/** 하루 1회 무료인 스프레드를 같은 날 다시 볼 때의 가격 */
export const EXTRA_DAILY_PRICE = 490;

/** 상대 정보를 넣은 궁합 리딩 가격 (스프레드와 무관하게 이 가격이 적용된다) */
export const COMPATIBILITY_PRICE = 3900;

/** 하루 1회 무료 (스프레드별로 따로 센다) */
const DAILY_FREE_SPREADS: ReadonlySet<SpreadType> = new Set<SpreadType>(['one-card', 'yes-no', 'daily-fortune']);

/** 유료 스프레드 가격. 여기 없는 스프레드는 하루 1회 무료 대상이다 */
const SPREAD_PRICES: Partial<Record<SpreadType, number>> = {
  'two-card': 990,
  'three-card': 990,
  'problem-solution': 990,
  'celtic-cross': 2900,
  'saju-custom': 2900,
  'six-months': 2900,
  custom: 2900,
  compatibility: COMPATIBILITY_PRICE,
};

/** 충전 단위 (결제 금액 = 지급 포인트) */
export const CHARGE_PACKAGES = [
  { id: 'p3000', amount: 3000, points: 3000 },
  { id: 'p5000', amount: 5000, points: 5000 },
  { id: 'p10000', amount: 10000, points: 10000 },
] as const;

export type ChargePackage = (typeof CHARGE_PACKAGES)[number];

export function findChargePackage(id: unknown): ChargePackage | null {
  if (typeof id !== 'string') return null;
  return CHARGE_PACKAGES.find((p) => p.id === id) ?? null;
}

export function isDailyFreeSpread(spreadType: SpreadType): boolean {
  return DAILY_FREE_SPREADS.has(spreadType);
}

/**
 * 이번 리딩에 차감할 포인트.
 * @param hasPartner 상대 생년월일을 함께 보냈는가 (궁합 리딩)
 * @param usedFreeToday 하루 1회 무료 스프레드를 오늘 이미 봤는가 (유료 스프레드에서는 쓰지 않는다)
 */
export function getReadingPrice(spreadType: SpreadType, hasPartner: boolean, usedFreeToday: boolean): number {
  if (hasPartner) return COMPATIBILITY_PRICE;
  if (isDailyFreeSpread(spreadType)) return usedFreeToday ? EXTRA_DAILY_PRICE : 0;
  // 가격표에 없는 유료 스프레드가 생기면 무료로 새지 않게 가장 낮은 유료 가격을 받는다
  return SPREAD_PRICES[spreadType] ?? 990;
}

/** 화면에 내려 주는 가격표 */
export function getPriceTable() {
  return {
    signupBonus: SIGNUP_BONUS_POINTS,
    extraDailyPrice: EXTRA_DAILY_PRICE,
    compatibilityPrice: COMPATIBILITY_PRICE,
    dailyFreeSpreads: [...DAILY_FREE_SPREADS],
    spreadPrices: SPREAD_PRICES,
    chargePackages: CHARGE_PACKAGES,
  };
}

/** 한국 시간 기준 오늘 날짜 'YYYY-MM-DD' (하루 1회 무료 기록의 키) */
export function todayKst(now: Date = new Date()): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 한국 시간 기준 오늘 0시 */
export function startOfTodayKst(now: Date = new Date()): Date {
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const midnightKstAsUtc = Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
  return new Date(midnightKstAsUtc - KST_OFFSET_MS);
}
