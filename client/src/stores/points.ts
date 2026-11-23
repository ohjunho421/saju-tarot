import { create } from 'zustand';
import { pointsApi, type PriceTable } from '../services/api';
import type { SpreadType } from '../types';

interface PointsState {
  /** 잔액. 로그인 전이거나 아직 불러오지 않았으면 null */
  points: number | null;
  /** 이 회원에게 요금·충전이 적용되는가. 유료 전환 전에는 false — 잔액·요금 표시를 숨긴다 */
  paid: boolean;
  /** 오늘 무료 리딩을 이미 쓴 스프레드 */
  usedFreeToday: SpreadType[];
  prices: PriceTable | null;
  chargeOpen: boolean;
  /** 충전 창에 보여 줄 안내 (예: 포인트가 모자라 리딩을 시작하지 못했을 때) */
  chargeNotice: string | null;

  loadPrices: () => Promise<void>;
  refresh: () => Promise<void>;
  setPoints: (points: number) => void;
  openCharge: (notice?: string) => void;
  closeCharge: () => void;
  reset: () => void;
}

export const usePointsStore = create<PointsState>((set, get) => ({
  points: null,
  paid: false,
  usedFreeToday: [],
  prices: null,
  chargeOpen: false,
  chargeNotice: null,

  loadPrices: async () => {
    if (get().prices) return;
    try {
      set({ prices: await pointsApi.getPrices() });
    } catch {
      // 가격표가 없으면 가격 표시만 빠진다 — 요금은 서버가 판단한다
    }
  },

  refresh: async () => {
    try {
      const mine = await pointsApi.getMine();
      set({ points: mine.points, usedFreeToday: mine.usedFreeToday, paid: mine.paid });
    } catch {
      // 잔액 표시만 비운다
    }
  },

  setPoints: (points) => set({ points }),
  openCharge: (notice) => set({ chargeOpen: true, chargeNotice: notice ?? null }),
  closeCharge: () => set({ chargeOpen: false, chargeNotice: null }),
  reset: () => set({ points: null, paid: false, usedFreeToday: [], chargeOpen: false, chargeNotice: null }),
}));

/**
 * 이 리딩에 드는 포인트 (서버 pricing.ts의 getReadingPrice와 같은 규칙).
 * 실제 차감은 서버가 하고, 여기 값은 안내용이다. 가격표를 아직 못 받았으면 null.
 */
export function readingPrice(
  prices: PriceTable | null,
  spreadType: SpreadType,
  hasPartner: boolean,
  usedFreeToday: SpreadType[],
): number | null {
  if (!prices) return null;
  if (hasPartner) return prices.compatibilityPrice;
  if (prices.dailyFreeSpreads.includes(spreadType)) {
    return usedFreeToday.includes(spreadType) ? prices.extraDailyPrice : 0;
  }
  return prices.spreadPrices[spreadType] ?? null;
}

export function formatPoints(value: number): string {
  return `${value.toLocaleString('ko-KR')}P`;
}
