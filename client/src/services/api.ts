import axios from 'axios';
import type { BirthInfo, SajuAnalysis, SpreadType, IntegratedReading, TarotCard, ApiResponse } from '../types';

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
    console.log('🔐 API 요청:', config.url);
    console.log('🔑 토큰:', token ? `${token.substring(0, 20)}...` : '없음');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization 헤더 추가됨');
    } else {
      console.warn('⚠️ 토큰이 없습니다!');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request 인터셉터 에러:', error);
    return Promise.reject(error);
  }
);

// Response 인터셉터: 에러 로깅
api.interceptors.response.use(
  (response) => {
    console.log('✅ API 응답 성공:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API 응답 에러:', error.config?.url, error.response?.status);
    console.error('에러 상세:', error.response?.data);
    
    if (error.response?.status === 401) {
      console.error('🔒 인증 실패: 401 Unauthorized');
      console.error('현재 토큰:', localStorage.getItem('token') ? '있음' : '없음');
      console.error('요청 헤더:', error.config?.headers);
      // 자동 로그아웃 제거 - 디버깅을 위해
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
};

// AI 해석 API
export const aiApi = {
  analyzeQuestion: async (question: string) => {
    const response = await api.post('/ai/analyze-question', { question });
    return response.data.data;
  },

  getAIReading: async (question: string, spreadType: SpreadType, includeAdviceCard?: boolean): Promise<IntegratedReading> => {
    const response = await api.post<ApiResponse<IntegratedReading>>('/ai/ai-reading', {
      question,
      spreadType,
      includeAdviceCard,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'AI 해석에 실패했습니다.');
    }
    return response.data.data;
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
    return response.data.data;
  },
};

export const interpretationApi = {
  getIntegrated: async (
    birthInfo: BirthInfo,
    spreadType: SpreadType,
    question?: string
  ): Promise<IntegratedReading> => {
    const response = await api.post<ApiResponse<IntegratedReading>>('/interpretation/integrated', {
      birthInfo,
      spreadType,
      question,
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
