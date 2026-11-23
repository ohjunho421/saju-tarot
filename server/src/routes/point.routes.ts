import { Router } from 'express';
import { getMyPointHistory, getMyPoints, getPrices } from '../controllers/point.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 가격표는 공개
router.get('/prices', getPrices);

// 내 잔액·내역
router.get('/me', authMiddleware, getMyPoints);
router.get('/history', authMiddleware, getMyPointHistory);

export default router;
