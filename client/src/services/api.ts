import axios from 'axios';
import type { BirthInfo, SajuAnalysis, SpreadType, IntegratedReading, TarotCard, ApiResponse, PointPackage, PointTransaction, SpreadCost } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CORS 요청 시 credentials 포함
});

// Request 인터셉터: 모든 요청에 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 필요 시 자동 로그아웃 처리 가능
    }
    return Promise.reject(error);
  }
);

// 인증 토큰 관리
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete api.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

// 초기 토큰 설정
const savedToken = localStorage.getItem('token');
if (savedToken) {
  setAuthToken(savedToken);
}

// 인증 API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    birthInfo: BirthInfo;
  }) => {
    const response = await api.post('/auth/register', data);
    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
    }
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
    }
    return response.data;
  },

  logout: () => {
    setAuthToken(null);
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },

  updateMbti: async (mbti: string | null) => {
    const response = await api.put('/auth/mbti', { mbti });
    return response.data;
  },
};

// AI 해석 API
export const aiApi = {
  analyzeQuestion: async (question: string) => {
    const response = await api.post('/ai/analyze-question', { question });
    return response.data.data;
  },

  getAIReading: async (
    question: string, 
    spreadType: SpreadType, 
    sajuAnalysis?: SajuAnalysis,
    selectedCards?: { cardIndex: number; isReversed: boolean }[],
    includeAdviceCard?: boolean
  ): Promise<IntegratedReading> => {
    const response = await api.post<ApiResponse<IntegratedReading>>('/ai/ai-reading', {
      question,
      spreadType,
      sajuAnalysis,  // 사주 분석 정보 전달
      selectedCards, // { cardIndex, isReversed }[] 형태로 전달
      includeAdviceCard,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'AI 해석에 실패했습니다.');
    }
    
    // 이미지 URL에 서버 baseURL 추가 (상대 경로를 절대 경로로 변환)
    const serverBaseUrl = API_BASE_URL.replace('/api', ''); // '/api' 제거
    const reading = response.data.data;
    reading.drawnCards = reading.drawnCards.map(dc => ({
      ...dc,
      card: {
        ...dc.card,
        imageUrl: dc.card.imageUrl && dc.card.imageUrl.startsWith('/') 
          ? `${serverBaseUrl}${dc.card.imageUrl}` 
          : dc.card.imageUrl
      }
    }));
    
    return reading;
  },

  getMyReadings: async (page = 1, limit = 10) => {
    const response = await api.get('/ai/my-readings', { params: { page, limit } });
    return response.data.data;
  },

  getReadingById: async (id: string) => {
    const response = await api.get(`/ai/readings/${id}`);
    return response.data.data;
  },
};

export const sajuApi = {
  analyze: async (birthInfo: BirthInfo): Promise<SajuAnalysis> => {
    const response = await api.post<ApiResponse<SajuAnalysis>>('/saju/analyze', birthInfo);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '사주 분석에 실패했습니다.');
    }
    return response.data.data;
  },
};

export const tarotApi = {
  drawCards: async (spreadType: SpreadType, question?: string) => {
    const response = await api.post('/tarot/draw', { spreadType, question });
    if (!response.data.success) {
      throw new Error(response.data.error || '타로 카드 추첨에 실패했습니다.');
    }
    return response.data.data;
  },

  getAllCards: async (): Promise<TarotCard[]> => {
    const response = await api.get<ApiResponse<TarotCard[]>>('/tarot/cards');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '카드 목록을 가져오는데 실패했습니다.');
    }
    
    // 이미지 URL에 서버 baseURL 추가 (상대 경로를 절대 경로로 변환)
    const serverBaseUrl = API_BASE_URL.replace('/api', ''); // '/api' 제거
    const cards = response.data.data.map(card => ({
      ...card,
      imageUrl: card.imageUrl && card.imageUrl.startsWith('/') 
        ? `${serverBaseUrl}${card.imageUrl}` 
        : card.imageUrl
    }));
    
    return cards;
  },
};

export const interpretationApi = {
  getIntegrated: async (
    birthInfo: BirthInfo,
    spreadType: SpreadType,
    question?: string,
    cardPositions?: number[]
  ): Promise<IntegratedReading> => {
    const response = await api.post<ApiResponse<IntegratedReading>>('/interpretation/integrated', {
      birthInfo,
      spreadType,
      question,
      cardPositions,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || '통합 해석에 실패했습니다.');
    }
    return response.data.data;
  },
};

// 리딩 내역 API
export const readingApi = {
  // 리딩 내역 조회
  getUserReadings: async (limit = 10, offset = 0) => {
    const response = await api.get('/readings', { params: { limit, offset } });
    return response.data;
  },

  // 특정 리딩 상세 조회
  getReadingById: async (id: string) => {
    const response = await api.get(`/readings/${id}`);
    return response.data;
  },

  // 리딩 삭제
  deleteReading: async (id: string) => {
    const response = await api.delete(`/readings/${id}`);
    return response.data;
  },
};

// 결제/포인트 API
export const paymentApi = {
  // 포인트 패키지 목록 조회
  getPackages: async (): Promise<PointPackage[]> => {
    const response = await api.get('/payment/packages');
    return response.data.packages;
  },

  // 내 포인트 잔액 조회
  getMyPoints: async (): Promise<number> => {
    const response = await api.get('/payment/points');
    return response.data.points;
  },

  // 포인트 거래 내역 조회
  getHistory: async (limit = 20, offset = 0): Promise<{
    transactions: PointTransaction[];
    total: number;
    hasMore: boolean;
  }> => {
    const response = await api.get('/payment/history', { params: { limit, offset } });
    return response.data;
  },

  // 스프레드별 필요 포인트 조회
  getSpreadCost: async (spreadType: string): Promise<SpreadCost> => {
    const response = await api.get(`/payment/spread-cost/${spreadType}`);
    return response.data;
  },

  // 포인트 충분 여부 확인
  checkPoints: async (spreadType: string): Promise<{
    hasEnough: boolean;
    currentPoints: number;
    requiredPoints: number;
    shortage: number;
  }> => {
    const response = await api.get('/payment/check', { params: { spreadType } });
    return response.data;
  },

  // 체크아웃 세션 생성 (레몬스퀴지)
  createCheckout: async (packageId: string, variantId: string): Promise<{ checkoutUrl: string }> => {
    const response = await api.post('/payment/checkout', { packageId, variantId });
    return response.data;
  },

  // 포인트 사용 (해석 열람)
  usePoints: async (spreadType: string, readingId?: string): Promise<{
    success: boolean;
    balance: number;
    message?: string;
    error?: string;
    requiredPoints?: number;
    currentPoints?: number;
  }> => {
    const response = await api.post('/payment/use', { spreadType, readingId });
    return response.data;
  },
};

export default api;
