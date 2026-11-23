import { Router } from 'express';
import { handleWebhook, preparePayment, verifyPayment } from '../controllers/payment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/prepare', authMiddleware, preparePayment);
router.post('/verify', authMiddleware, verifyPayment);

// 포트원이 호출하는 공개 주소 — 서명으로 확인한다 (services/portone.ts)
router.post('/webhook', handleWebhook);

export default router;
