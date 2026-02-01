import { Router } from 'express';
import { register, login, getMe, updateMbti } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// 회원가입
router.post('/register', register);

// 로그인
router.post('/login', login);

// 내 정보 조회 (인증 필요)
router.get('/me', authMiddleware, getMe);

// MBTI 업데이트 (인증 필요)
router.put('/mbti', authMiddleware, updateMbti);

export default router;
