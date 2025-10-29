import { Router } from 'express';
import {
  saveReading,
  getUserReadings,
  getReadingById,
  getRecentContext,
  deleteReading
} from '../controllers/reading.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 모든 reading 엔드포인트는 인증 필요
router.use(authMiddleware);

// 타로 리딩 저장
router.post('/', saveReading);

// 사용자의 리딩 내역 조회
router.get('/', getUserReadings);

// AI 해석용 최근 컨텍스트 조회
router.get('/context', getRecentContext);

// 특정 리딩 상세 조회
router.get('/:id', getReadingById);

// 리딩 삭제
router.delete('/:id', deleteReading);

export default router;
