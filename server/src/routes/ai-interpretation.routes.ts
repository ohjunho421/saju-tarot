import { Router } from 'express';
import {
  analyzeQuestion,
  getAIIntegratedReading,
  getMyReadings,
  getReadingById
} from '../controllers/ai-interpretation.controller';
import { chatWithReading } from '../controllers/chat.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authMiddleware);

// 질문 분석 및 스프레드 추천
router.post('/analyze-question', analyzeQuestion);

// AI 기반 통합 해석
router.post('/ai-reading', getAIIntegratedReading);

// 리딩 결과에 대한 챗봇
router.post('/chat', chatWithReading);

// 내 리딩 히스토리
router.get('/my-readings', getMyReadings);

// 특정 리딩 조회
router.get('/readings/:id', getReadingById);

export default router;
