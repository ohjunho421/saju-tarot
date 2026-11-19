import { Router } from 'express';
import { register, login, getMe, updateMbti } from '../controllers/auth.controller';
import { getProviders, startKakaoLogin, kakaoCallback, kakaoSession, completeKakaoSignup } from '../controllers/kakao-auth.controller';
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

// 소셜 로그인 (카카오)
router.get('/providers', getProviders);
router.get('/kakao/start', startKakaoLogin);
router.get('/kakao/callback', kakaoCallback);
router.post('/kakao/session', kakaoSession);
router.post('/kakao/complete', completeKakaoSignup);

export default router;
