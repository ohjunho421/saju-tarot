import { create } from 'zustand';
import { paymentApi } from '../services/api';
import type { PointPackage, PointTransaction } from '../types';

interface PointState {
  points: number;
  packages: PointPackage[];
  transactions: PointTransaction[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPoints: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  fetchHistory: (limit?: number, offset?: number) => Promise<void>;
  checkSpreadCost: (spreadType: string) => Promise<{
    hasEnough: boolean;
    requiredPoints: number;
    shortage: number;
  }>;
  usePoints: (spreadType: string, readingId?: string) => Promise<boolean>;
  createCheckout: (packageId: string, variantId: string) => Promise<string | null>;
  setPoints: (points: number) => void;
  clearError: () => void;
}

export const usePointStore = create<PointState>((set) => ({
  points: 0,
  packages: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchPoints: async () => {
    try {
      set({ isLoading: true, error: null });
      const points = await paymentApi.getMyPoints();
      set({ points, isLoading: false });
    } catch (error: any) {
      console.error('포인트 조회 실패:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  fetchPackages: async () => {
    try {
      set({ isLoading: true, error: null });
      const packages = await paymentApi.getPackages();
      set({ packages, isLoading: false });
    } catch (error: any) {
      console.error('패키지 조회 실패:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  fetchHistory: async (limit = 20, offset = 0) => {
    try {
      set({ isLoading: true, error: null });
      const { transactions } = await paymentApi.getHistory(limit, offset);
      set({ transactions, isLoading: false });
    } catch (error: any) {
      console.error('거래 내역 조회 실패:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  checkSpreadCost: async (spreadType: string) => {
    try {
      const result = await paymentApi.checkPoints(spreadType);
      set({ points: result.currentPoints });
      return {
        hasEnough: result.hasEnough,
        requiredPoints: result.requiredPoints,
        shortage: result.shortage,
      };
    } catch (error: any) {
      console.error('포인트 확인 실패:', error);
      throw error;
    }
  },

  usePoints: async (spreadType: string, readingId?: string) => {
    try {
      set({ isLoading: true, error: null });
      const result = await paymentApi.usePoints(spreadType, readingId);
      
      if (result.success) {
        set({ points: result.balance, isLoading: false });
        return true;
      } else {
        set({ isLoading: false, error: result.error || '포인트 사용 실패' });
        return false;
      }
    } catch (error: any) {
      console.error('포인트 사용 실패:', error);
      set({ isLoading: false, error: error.response?.data?.error || error.message });
      return false;
    }
  },

  createCheckout: async (packageId: string, variantId: string) => {
    try {
      set({ isLoading: true, error: null });
      const { checkoutUrl } = await paymentApi.createCheckout(packageId, variantId);
      set({ isLoading: false });
      return checkoutUrl;
    } catch (error: any) {
      console.error('체크아웃 생성 실패:', error);
      set({ isLoading: false, error: error.message });
      return null;
    }
  },

  setPoints: (points: number) => {
    set({ points });
  },

  clearError: () => {
    set({ error: null });
  },
}));
