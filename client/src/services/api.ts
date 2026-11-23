import axios from 'axios';
import type { BirthInfo, SajuAnalysis, SpreadType, IntegratedReading, TarotCard, ApiResponse, CustomPosition, CustomSpreadDesign, SpreadChatMessage } from '../types';

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

// responseType: 'blob' 요청이 실패하면 서버 안내({ error })도 Blob으로 온다. 글로 꺼내 본다
const readBlobError = async (error: unknown): Promise<string | undefined> => {
  if (!axios.isAxiosError(error) || !(error.response?.data instanceof Blob)) return undefined;
  try {
    const body: unknown = JSON.parse(await error.response.data.text());
    return typeof body === 'object' && body !== null && typeof (body as { error?: unknown }).error === 'string'
      ? (body as { error: string }).error
      : undefined;
  } catch {
    return undefined;
  }
};

// 서버가 리딩 요청을 거절함(4xx: 호출 한도, 잘못된 질문 등). 저장된 리딩이 없어 복구할 것도 없다
export class ReadingRejectedError extends Error {}

// 포인트가 모자라 리딩을 시작하지 못함 (402). 화면이 충전 창을 연다
export class InsufficientPointsError extends ReadingRejectedError {
  readonly required: number;
  readonly balance: number;

  constructor(message: string, required: number, balance: number) {
    super(message);
    this.required = required;
    this.balance = balance;
  }
}

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

// 카카오·구글에서는 이름(닉네임)만 받는다(없으면 빈 문자열). 생년월일은 가입 화면에서 직접 입력
export interface SocialSignupProfile {
  nickname: string;
}

export type SocialSessionResult =
  | { type: 'login' }
  | { type: 'signup'; profile: SocialSignupProfile };

export type SocialProviderId = 'kakao' | 'google';

// 인증 API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    name: string;
    birthInfo: BirthInfo;
    mbti?: string;
    agreeTerms: true;
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

  // 키가 설정된 소셜 로그인만 true
  getProviders: async (): Promise<Record<SocialProviderId, boolean>> => {
    const response = await api.get('/auth/providers');
    const data = response.data?.data;
    return { kakao: data?.kakao === true, google: data?.google === true };
  },

  // 소셜 로그인 시작 주소. 끝나면 서버가 returnTo(지금 화면 주소)로 돌려보낸다
  // bindHash: 이 브라우저에 둔 무작위 값의 해시. 돌아온 표는 원래 값이 있어야 쓸 수 있다
  socialStartUrl: (provider: SocialProviderId, returnTo: string, bindHash: string): string =>
    `${API_BASE_URL}/auth/${provider}/start?returnTo=${encodeURIComponent(returnTo)}&bind=${bindHash}`,

  // 소셜 로그인에서 돌아온 표를 로그인(기존 회원) 또는 가입 정보(새 회원)로 바꾼다
  socialSession: async (provider: SocialProviderId, ticket: string, bind: string): Promise<SocialSessionResult> => {
    const response = await api.post(`/auth/${provider}/session`, { ticket, bind });
    const data = response.data.data;
    if (data.type === 'login') {
      setAuthToken(data.token);
      return { type: 'login' };
    }
    return { type: 'signup', profile: data.profile };
  },

  socialComplete: async (
    provider: SocialProviderId,
    data: { ticket: string; bind: string; name: string; birthInfo: BirthInfo; mbti?: string; agreeTerms: true },
  ) => {
    const response = await api.post(`/auth/${provider}/complete`, data);
    if (response.data.success && response.data.data.token) {
      setAuthToken(response.data.data.token);
    }
    return response.data;
  },
};

// AI 해석 API
export const aiApi = {
  analyzeQuestion: async (question: string) => {
    const response = await api.post('/ai/analyze-question', { question });
    return response.data.data;
  },

  // 대화로 맞춤 배치 설계
  designSpread: async (
    question: string,
    messages: SpreadChatMessage[],
    current: CustomSpreadDesign | null
  ): Promise<CustomSpreadDesign> => {
    const fallbackMessage = '배치를 만들지 못했어요. 잠시 후 다시 시도해 주세요.';
    try {
      const response = await api.post<ApiResponse<CustomSpreadDesign>>('/ai/design-spread', {
        question,
        messages,
        current: current ? { name: current.name, positions: current.positions } : null,
      });
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || fallbackMessage);
      }
      return response.data.data;
    } catch (error) {
      // 서버 안내(호출 한도, 수정 횟수 초과 등)를 화면에 그대로 보여준다
      const serverMessage = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      if (typeof serverMessage === 'string') throw new Error(serverMessage);
      if (error instanceof Error && !axios.isAxiosError(error)) throw error;
      throw new Error(fallbackMessage);
    }
  },

  getAIReading: async (
    question: string,
    spreadType: SpreadType,
    sajuAnalysis?: SajuAnalysis,
    selectedCards?: { cardIndex: number; isReversed: boolean }[],
    includeAdviceCard?: boolean,
    partnerBirthInfo?: BirthInfo,
    partnerMbti?: string,
    customPositions?: CustomPosition[]
  ): Promise<IntegratedReading> => {
    const response = await api.post<ApiResponse<IntegratedReading>>('/ai/ai-reading', {
      question,
      spreadType,
      sajuAnalysis,
      selectedCards,
      includeAdviceCard,
      partnerBirthInfo,
      partnerMbti,
      customPositions,
    }).catch((error: unknown) => {
      // 서버가 거절했으면 안내 문구를 그대로 보여준다. 5xx·네트워크 오류는 그대로 던져 화면 꺼짐 복구가 처리하게 둔다
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        const message = error.response?.data?.error;
        if (status === 402 && typeof message === 'string') {
          const { required, balance } = error.response?.data ?? {};
          throw new InsufficientPointsError(message, Number(required) || 0, Number(balance) || 0);
        }
        if (status >= 400 && status < 500 && typeof message === 'string') throw new ReadingRejectedError(message);
      }
      throw error;
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

  // 서버에 목소리 기능(Fish 키)이 켜져 있으면 true
  getVoiceStatus: async (): Promise<boolean> => {
    const response = await api.get('/ai/voice-status');
    return response.data?.data?.available === true;
  },

  // 리딩을 상담사가 말로 들려주는 음성(mp3). 처음엔 대본과 음성을 만드느라 20초쯤 걸린다
  getReadingVoice: async (readingId: string, signal?: AbortSignal): Promise<Blob> => {
    try {
      const response = await api.post(`/ai/readings/${encodeURIComponent(readingId)}/voice`, {}, {
        responseType: 'blob',
        signal,
        timeout: 150_000, // 대본(약 10초) + 무료 모델 음성 합성(40초 이상)
      });
      const blob = response.data as Blob;
      if (!blob.type.startsWith('audio/')) throw new Error('목소리를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
      return blob;
    } catch (error) {
      if (axios.isCancel(error)) throw error;
      if (error instanceof Error && !axios.isAxiosError(error)) throw error;
      throw new Error(await readBlobError(error) ?? '목소리를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  },

  getReadingById: async (id: string): Promise<IntegratedReading> => {
    const response = await api.get<ApiResponse<IntegratedReading>>(`/ai/readings/${id}`);
    if (!response.data.success || !response.data.data) {
      throw new Error('리딩 조회에 실패했습니다.');
    }

    // 이미지 URL에 서버 baseURL 추가
    const serverBaseUrl = API_BASE_URL.replace('/api', '');
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

export default api;

// ---------- 포인트·결제 ----------

export interface ChargePackage {
  id: string;
  amount: number;
  points: number;
}

// 서버 가격표 (server/src/services/pricing.ts) — 화면에는 가격을 따로 적어 두지 않는다
export interface PriceTable {
  signupBonus: number;
  extraDailyPrice: number;
  compatibilityPrice: number;
  dailyFreeSpreads: SpreadType[];
  spreadPrices: Partial<Record<SpreadType, number>>;
  chargePackages: ChargePackage[];
  /** 요금이 모든 회원에게 적용 중인가 */
  paidMode: boolean;
}

export interface PointTransaction {
  id: string;
  type: 'charge' | 'use' | 'refund';
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
}

export interface PreparedPayment {
  paymentId: string;
  amount: number;
  points: number;
  orderName: string;
  storeId: string;
  channelKey: string;
  payMethod: 'CARD' | 'EASY_PAY';
  noticeUrl: string | null; // 이 결제의 웹훅 주소(같은 상점의 다른 서비스와 섞이지 않게)
}

export type VerifyResult =
  | { status: 'paid'; points: number; charged: number }
  | { status: 'pending' }
  /** 다시 물어도 같은 판정 */
  | { status: 'failed'; message: string }
  /** 일시 오류 — 잠시 후 다시 확인 */
  | { status: 'retry'; message: string };

export const pointsApi = {
  getPrices: async (): Promise<PriceTable> => {
    const response = await api.get<ApiResponse<PriceTable>>('/points/prices');
    if (!response.data.data) throw new Error('가격표를 불러오지 못했습니다.');
    return response.data.data;
  },

  getMine: async (): Promise<{ points: number; usedFreeToday: SpreadType[]; paid: boolean }> => {
    const response = await api.get('/points/me');
    return response.data.data;
  },

  getHistory: async (): Promise<PointTransaction[]> => {
    const response = await api.get('/points/history');
    return response.data.data;
  },
};

export const paymentApi = {
  prepare: async (packageId: string): Promise<PreparedPayment> => {
    try {
      const response = await api.post('/payments/prepare', { packageId });
      return response.data.data;
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.error : undefined;
      throw new Error(typeof message === 'string' ? message : '결제를 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  },

  verify: async (paymentId: string): Promise<VerifyResult> => {
    try {
      const response = await api.post('/payments/verify', { paymentId }, { validateStatus: (s) => s === 200 || s === 202 });
      if (response.status === 202) return { status: 'pending' };
      return { status: 'paid', points: response.data.data.points, charged: response.data.data.charged };
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      const message = typeof data?.error === 'string' ? data.error : '결제를 확인하지 못했습니다.';
      return data?.final ? { status: 'failed', message } : { status: 'retry', message };
    }
  },
};
