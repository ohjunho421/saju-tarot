import axios from 'axios';
import type { BirthInfo, SajuAnalysis, SpreadType, IntegratedReading, TarotCard, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
