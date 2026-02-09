import { Router } from 'express';
import {
  getPointPackages,
  getMyPoints,
  getPointHistory,
  createCheckout,
  getSpreadCost,
  usePointsForReading,
  checkPoints
} from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 공개 엔드포인트
router.get('/packages', getPointPackages);
router.get('/spread-cost/:spreadType', getSpreadCost);

// 웹훅은 index.ts에서 express.json() 전에 등록됨 (raw body 필요)

// 인증 필요 엔드포인트
router.get('/points', authMiddleware, getMyPoints);
router.get('/history', authMiddleware, getPointHistory);
router.post('/checkout', authMiddleware, createCheckout);
router.post('/use', authMiddleware, usePointsForReading);
router.get('/check', authMiddleware, checkPoints);

export default router;
