// 카카오 로그인
// 1) /kakao/start: state를 만들어 쿠키(브라우저 묶기)와 함께 카카오로 보낸다.
//    화면은 무작위 값(bind)을 자기 저장소에 두고 그 해시만 보낸다
// 2) /kakao/callback: state를 확인하고 카카오 정보를 받아 짧은 표를 화면 주소의 # 뒤에 실어 돌려보낸다
//    (# 뒤는 서버 로그·Referer에 남지 않는다). 표에는 bind 해시가 들어 있다
// 3) /kakao/session: 표를 로그인 토큰(기존 회원) 또는 가입 정보(새 회원)로 바꾼다
// 4) /kakao/complete: 사용자가 확인·수정한 생년월일과 MBTI로 가입을 마친다
// 3)·4)는 bind 원래 값이 표의 해시와 맞아야 한다. 남이 받은 표를 링크로 보내도(로그인 CSRF)
// 그 브라우저에는 bind가 없어 쓸 수 없다
import crypto from 'crypto';
import { Request, Response } from 'express';
import { Prisma, User } from '@prisma/client';
import prisma from '../utils/prisma';
import { SajuService } from '../services/saju.service';
import { generateToken, signTicket, verifyTicket } from '../utils/jwt';
import {
  buildAuthorizeUrl,
  fetchKakaoProfile,
  getReturnOrigins,
  isKakaoConfigured,
  isRecord,
  resolveReturnOrigin,
} from '../services/kakao.service';
import { createUserRateLimiter } from '../utils/user-rate-limit';
import type { BirthInfo } from '../models/saju.model';

const sajuService = new SajuService();

// 콜백은 요청마다 서버가 카카오에 토큰을 요청한다. 한 곳에서 반복해 카카오 앱 한도를 쓰지 못하게 막는다
const allowCallback = createUserRateLimiter(30, 10 * 60 * 1000);
const allowComplete = createUserRateLimiter(20, 10 * 60 * 1000);

const STATE_COOKIE = 'kakao_oauth_state';
const STATE_COOKIE_PATH = '/api/auth/kakao';
const STATE_TTL_SECONDS = 10 * 60;
const LOGIN_TICKET_TTL_SECONDS = 2 * 60; // 화면이 돌아오자마자 바꾸므로 짧게
const SIGNUP_TICKET_TTL_SECONDS = 30 * 60;
const NAME_MAX_LENGTH = 30;

const VALID_MBTIS = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

// Railway 프록시는 X-Forwarded-For 끝에 실제 접속 주소를 붙인다(앞쪽은 요청자가 꾸밀 수 있음).
// 앱 전체 trust proxy는 건드리지 않고 여기서만 읽는다
const clientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const header = Array.isArray(forwarded) ? forwarded.join(',') : forwarded;
  const last = header?.split(',').map((part) => part.trim()).filter(Boolean).pop();
  return last || req.socket.remoteAddress || 'unknown';
};

// state는 한 번만 쓴다 (같은 state로 콜백을 되풀이해 카카오 요청을 늘리지 못하게)
const usedStateNonces = new Map<string, number>();
const consumeStateNonce = (nonce: string): boolean => {
  const now = Date.now();
  for (const [key, expiresAt] of usedStateNonces) {
    if (expiresAt <= now) usedStateNonces.delete(key);
  }
  if (usedStateNonces.has(nonce)) return false;
  usedStateNonces.set(nonce, now + STATE_TTL_SECONDS * 1000);
  return true;
};

const ALREADY_JOINED = '이미 가입한 카카오 계정이에요. 카카오로 다시 로그인해 주세요.';

const redirectWithHash = (res: Response, origin: string, key: string, value: string): void => {
  res.redirect(`${origin}/#${key}=${encodeURIComponent(value)}`);
};

const readCookie = (req: Request, name: string): string | undefined => {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) {
      try {
        return decodeURIComponent(rest.join('='));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
};

const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const BIND_HASH_PATTERN = /^[0-9a-f]{64}$/; // 화면이 보낸 bind의 SHA-256 (16진수)
const BIND_MAX_LENGTH = 128;

// 표를 받은 브라우저가 로그인을 시작한 브라우저인지 확인한다
const isBoundToCaller = (ticket: Record<string, unknown>, bind: unknown): boolean => {
  if (typeof ticket.bh !== 'string' || typeof bind !== 'string' || bind.length === 0 || bind.length > BIND_MAX_LENGTH) {
    return false;
  }
  const hash = crypto.createHash('sha256').update(bind).digest('hex');
  return safeEqual(hash, ticket.bh);
};

const toUserResponse = (user: User) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  birthInfo: user.birthInfo,
  sajuAnalysis: user.sajuAnalysis,
});

const loginResponse = (user: User) => ({
  type: 'login' as const,
  token: generateToken({ userId: user.id, email: user.email }),
  user: toUserResponse(user),
});

const isIntInRange = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;

const isValidSolarDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

// 화면에서 확인·수정한 생년월일. 형식이 하나라도 다르면 받지 않는다
const parseBirthInfo = (value: unknown): BirthInfo | null => {
  if (!isRecord(value)) return null;
  const { year, month, day, hour, isLunar, isLeapMonth, gender } = value;
  if (!isIntInRange(year, 1900, new Date().getFullYear())) return null;
  if (!isIntInRange(month, 1, 12) || !isIntInRange(day, 1, 31)) return null;
  if (hour !== undefined && hour !== null && !isIntInRange(hour, 0, 23)) return null;
  if (gender !== 'male' && gender !== 'female') return null;
  const lunar = isLunar === true;
  if (lunar ? day > 30 : !isValidSolarDate(year, month, day)) return null;
  return {
    year,
    month,
    day,
    ...(typeof hour === 'number' ? { hour } : {}),
    isLunar: lunar,
    isLeapMonth: lunar && isLeapMonth === true,
    gender,
  };
};

// 보이지 않는 문자(제어·서식·깨진 서로게이트·줄 구분 문자, 한글 채움 문자, 점자 공백)를 지운 이름.
// 글자나 숫자가 하나는 있어야 한다
const cleanName = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const name = value.replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}\u115F\u1160\u2800\u3164\uFFA0]/gu, '').trim();
  const length = Array.from(name).length;
  return length > 0 && length <= NAME_MAX_LENGTH && /[\p{L}\p{N}]/u.test(name) ? name : null;
};

// 사용할 수 있는 소셜 로그인 (키가 설정된 것만)
export const getProviders = (req: Request, res: Response): void => {
  res.json({ success: true, data: { kakao: isKakaoConfigured() } });
};

export const startKakaoLogin = (req: Request, res: Response): void => {
  const returnTo = resolveReturnOrigin(req.query.returnTo);
  const bindHash = req.query.bind;
  if (!returnTo || typeof bindHash !== 'string' || !BIND_HASH_PATTERN.test(bindHash)) {
    res.status(400).send('로그인 요청이 올바르지 않습니다. 화면에서 카카오 버튼을 다시 눌러 주세요.');
    return;
  }

  const nonce = crypto.randomBytes(16).toString('hex');
  const authorizeUrl = buildAuthorizeUrl(
    signTicket('kakao-state', { n: nonce, r: returnTo, bh: bindHash }, STATE_TTL_SECONDS)
  );
  if (!authorizeUrl) {
    redirectWithHash(res, returnTo, 'kakao_error', 'unavailable');
    return;
  }

  res.cookie(STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: 'lax', // 카카오에서 돌아오는 최상위 이동(GET)에는 실린다
    secure: process.env.NODE_ENV === 'production',
    maxAge: STATE_TTL_SECONDS * 1000,
    path: STATE_COOKIE_PATH,
  });
  res.redirect(authorizeUrl);
};

export const kakaoCallback = async (req: Request, res: Response): Promise<void> => {
  const state = typeof req.query.state === 'string' ? verifyTicket(req.query.state, 'kakao-state') : null;
  const cookieNonce = readCookie(req, STATE_COOKIE);
  res.clearCookie(STATE_COOKIE, { path: STATE_COOKIE_PATH });

  const returnTo = state ? resolveReturnOrigin(state.r) : null;
  // state가 없거나 이 브라우저에서 시작한 요청이 아니면(로그인 CSRF), 이미 쓴 state면 진행하지 않는다
  if (
    !state || !returnTo || typeof state.n !== 'string' || typeof state.bh !== 'string' ||
    !cookieNonce || !safeEqual(state.n, cookieNonce) || !consumeStateNonce(state.n)
  ) {
    redirectWithHash(res, returnTo ?? getReturnOrigins()[0], 'kakao_error', 'expired');
    return;
  }
  if (!allowCallback(clientIp(req))) {
    redirectWithHash(res, returnTo, 'kakao_error', 'failed');
    return;
  }
  if (typeof req.query.error === 'string') {
    redirectWithHash(res, returnTo, 'kakao_error', req.query.error === 'access_denied' ? 'cancelled' : 'failed');
    return;
  }
  const code = req.query.code;
  if (typeof code !== 'string' || code.length === 0) {
    redirectWithHash(res, returnTo, 'kakao_error', 'failed');
    return;
  }

  try {
    const profile = await fetchKakaoProfile(code);
    const existing = await prisma.user.findUnique({ where: { kakaoId: profile.kakaoId }, select: { id: true } });
    if (existing) {
      redirectWithHash(
        res, returnTo, 'kakao_login',
        signTicket('kakao-login', { uid: existing.id, bh: state.bh }, LOGIN_TICKET_TTL_SECONDS)
      );
      return;
    }
    const ticket = signTicket(
      'kakao-signup',
      { kid: profile.kakaoId, nick: profile.nickname, bi: profile.birthInfo, bh: state.bh },
      SIGNUP_TICKET_TTL_SECONDS
    );
    redirectWithHash(res, returnTo, 'kakao_signup', ticket);
  } catch (error) {
    console.error('카카오 로그인 오류:', error instanceof Error ? error.message : 'unknown');
    redirectWithHash(res, returnTo, 'kakao_error', 'failed');
  }
};


// 표를 로그인 토큰(기존 회원) 또는 가입 정보(새 회원)로 바꾼다
export const kakaoSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = req.body?.ticket;
    const bind = req.body?.bind;
    if (typeof ticket !== 'string') {
      res.status(400).json({ error: '로그인 정보가 없습니다.' });
      return;
    }

    const login = verifyTicket(ticket, 'kakao-login');
    if (login && typeof login.uid === 'string' && isBoundToCaller(login, bind)) {
      const user = await prisma.user.findUnique({ where: { id: login.uid } });
      if (!user) {
        res.status(401).json({ error: '로그인 시간이 지났어요. 다시 시도해 주세요.' });
        return;
      }
      const updated = await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
      res.json({ success: true, data: loginResponse(updated) });
      return;
    }

    const signup = verifyTicket(ticket, 'kakao-signup');
    if (signup && typeof signup.kid === 'string' && isBoundToCaller(signup, bind)) {
      // 다른 탭에서 이미 가입을 마쳤다면 가입 표로 로그인시키지 않고 다시 로그인하게 한다
      // (가입 표는 30분짜리라 로그인 수단으로 쓰이면 안 된다)
      const existing = await prisma.user.findUnique({ where: { kakaoId: signup.kid }, select: { id: true } });
      if (existing) {
        res.status(409).json({ error: ALREADY_JOINED });
        return;
      }
      res.json({
        success: true,
        data: {
          type: 'signup',
          profile: {
            nickname: typeof signup.nick === 'string' ? signup.nick : '',
            birthInfo: isRecord(signup.bi) ? signup.bi : {},
          },
        },
      });
      return;
    }

    res.status(401).json({ error: '로그인 시간이 지났어요. 다시 시도해 주세요.' });
  } catch (error) {
    console.error('카카오 로그인 확인 오류:', error instanceof Error ? error.message : 'unknown');
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
};

// 확인·수정한 생년월일과 MBTI로 가입을 마친다
export const completeKakaoSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const body: unknown = req.body;
    const signup = isRecord(body) && typeof body.ticket === 'string' ? verifyTicket(body.ticket, 'kakao-signup') : null;
    if (!isRecord(body) || !signup || typeof signup.kid !== 'string' || !isBoundToCaller(signup, body.bind)) {
      res.status(401).json({ error: '가입 시간이 지났어요. 카카오로 다시 시작해 주세요.' });
      return;
    }
    const kakaoId = signup.kid;
    if (!allowComplete(clientIp(req))) {
      res.status(429).json({ error: '잠시 후 다시 시도해 주세요.' });
      return;
    }

    const name = cleanName(body.name);
    if (!name) {
      res.status(400).json({ error: `이름을 ${NAME_MAX_LENGTH}자 이내로 입력해 주세요.` });
      return;
    }
    const birthInfo = parseBirthInfo(body.birthInfo);
    if (!birthInfo) {
      res.status(400).json({ error: '생년월일을 다시 확인해 주세요.' });
      return;
    }
    const mbtiUpper = typeof body.mbti === 'string' ? body.mbti.toUpperCase() : '';
    const mbti = VALID_MBTIS.includes(mbtiUpper) ? mbtiUpper : null;

    const existing = await prisma.user.findUnique({ where: { kakaoId }, select: { id: true } });
    if (existing) {
      res.status(409).json({ error: ALREADY_JOINED });
      return;
    }

    let sajuAnalysis;
    try {
      sajuAnalysis = sajuService.analyzeSaju(birthInfo);
    } catch {
      res.status(400).json({ error: '이 날짜로는 사주를 계산하지 못했어요. 생년월일을 다시 확인해 주세요.' });
      return;
    }

    try {
      const user = await prisma.user.create({
        data: {
          kakaoId,
          name,
          birthInfo: birthInfo as unknown as Prisma.InputJsonValue,
          sajuAnalysis: sajuAnalysis as unknown as Prisma.InputJsonValue,
          ...(mbti ? { mbti } : {}),
          lastLoginAt: new Date(),
        },
      });
      res.status(201).json({ success: true, message: '회원가입이 완료되었습니다.', data: loginResponse(user) });
    } catch (error) {
      // 같은 카카오 계정으로 동시에 가입한 경우
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        res.status(409).json({ error: ALREADY_JOINED });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('카카오 가입 오류:', error instanceof Error ? error.message : 'unknown');
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
};
