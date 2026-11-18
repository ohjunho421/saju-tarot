// 카카오 로그인 (REST API, 인가 코드 방식)
// 문서: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
// 생일·출생 연도·성별은 카카오 개발자 콘솔에서 동의항목을 받아야 온다. 없으면 빈 값으로 두고 사용자가 직접 입력한다
import type { BirthInfo } from '../models/saju.model';

const AUTHORIZE_URL = 'https://kauth.kakao.com/oauth/authorize';
const TOKEN_URL = 'https://kauth.kakao.com/oauth/token';
const USER_URL = 'https://kapi.kakao.com/v2/user/me';
const REQUEST_TIMEOUT_MS = 10_000;

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export interface KakaoProfile {
  kakaoId: string;
  nickname: string;
  birthInfo: Partial<BirthInfo>; // 카카오가 준 것만 채운다
}

interface KakaoConfig {
  restApiKey: string;
  clientSecret?: string;
  redirectUri: string;
}

const getConfig = (): KakaoConfig | null => {
  const restApiKey = process.env.KAKAO_REST_API_KEY;
  const redirectUri = process.env.KAKAO_REDIRECT_URI;
  if (!restApiKey || !redirectUri) return null;
  return { restApiKey, redirectUri, clientSecret: process.env.KAKAO_CLIENT_SECRET || undefined };
};

export const isKakaoConfigured = (): boolean => getConfig() !== null;

// http·https 주소의 origin만. 스킴 없는 값·javascript:·data: 등은 origin이 'null'이라 버린다
const originOf = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.origin : null;
  } catch {
    return null;
  }
};

// 로그인 뒤 돌아갈 수 있는 화면 주소. 와일드카드를 쓰지 않는다(다른 *.vercel.app으로 표가 새지 않게)
export const getReturnOrigins = (): string[] => {
  const fromEnv = (process.env.SOCIAL_LOGIN_RETURN_ORIGINS || '')
    .split(',')
    .map((value) => originOf(value.trim()))
    .filter((value): value is string => Boolean(value));
  const defaults = process.env.NODE_ENV === 'production'
    ? ['https://saju-tarot.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3001'];
  // Railway 서버가 화면도 내려주므로(Dockerfile에서 client/dist 빌드) 콜백 주소와 같은 곳도 허용
  const serverOrigin = originOf(process.env.KAKAO_REDIRECT_URI);
  const all = [...(fromEnv.length > 0 ? fromEnv : defaults), ...(serverOrigin ? [serverOrigin] : [])];
  return Array.from(new Set(all));
};

export const resolveReturnOrigin = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const origin = originOf(value);
  return origin && getReturnOrigins().includes(origin) ? origin : null;
};

export const buildAuthorizeUrl = (state: string): string | null => {
  const config = getConfig();
  if (!config) return null;
  const params = new URLSearchParams({
    client_id: config.restApiKey,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
};

const exchangeCode = async (config: KakaoConfig, code: string): Promise<string> => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.restApiKey,
    redirect_uri: config.redirectUri,
    code,
    ...(config.clientSecret ? { client_secret: config.clientSecret } : {}),
  });
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: body.toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data: unknown = await response.json().catch(() => null);
  const accessToken = isRecord(data) ? data.access_token : undefined;
  if (!response.ok || typeof accessToken !== 'string') {
    // 응답 본문에는 토큰이 있을 수 있어 오류 코드만 남긴다
    const errorCode = isRecord(data) ? data.error_code ?? data.error : undefined;
    throw new Error(`카카오 토큰 요청 실패 (${response.status}${errorCode ? `, ${String(errorCode)}` : ''})`);
  }
  return accessToken;
};

// 카카오 사용자 정보에서 생년월일 관련 값만 골라 낸다. 형식이 다르면 버린다
export const parseKakaoUser = (data: unknown): KakaoProfile | null => {
  if (!isRecord(data) || (typeof data.id !== 'number' && typeof data.id !== 'string')) return null;
  const account = isRecord(data.kakao_account) ? data.kakao_account : {};
  const profile = isRecord(account.profile) ? account.profile : {};
  const properties = isRecord(data.properties) ? data.properties : {};
  const nicknameRaw = profile.nickname ?? properties.nickname;
  // 글자 단위로 자른다(이모지를 반으로 자르면 깨진 문자가 남는다)
  const nickname = typeof nicknameRaw === 'string' ? Array.from(nicknameRaw.trim()).slice(0, 30).join('') : '';

  const birthInfo: Partial<BirthInfo> = {};
  if (typeof account.birthyear === 'string' && /^\d{4}$/.test(account.birthyear)) {
    birthInfo.year = Number(account.birthyear);
  }
  if (typeof account.birthday === 'string' && /^\d{4}$/.test(account.birthday)) {
    const month = Number(account.birthday.slice(0, 2));
    const day = Number(account.birthday.slice(2));
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      birthInfo.month = month;
      birthInfo.day = day;
      birthInfo.isLunar = account.birthday_type === 'LUNAR';
      birthInfo.isLeapMonth = birthInfo.isLunar && account.is_leap_month === true;
    }
  }
  if (account.gender === 'male' || account.gender === 'female') {
    birthInfo.gender = account.gender;
  }

  return { kakaoId: String(data.id), nickname, birthInfo };
};

export const fetchKakaoProfile = async (code: string): Promise<KakaoProfile> => {
  const config = getConfig();
  if (!config) throw new Error('카카오 로그인이 설정되지 않았습니다.');
  const accessToken = await exchangeCode(config, code);
  const response = await fetch(USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`카카오 사용자 정보 요청 실패 (${response.status})`);
  const profile = parseKakaoUser(await response.json());
  if (!profile) throw new Error('카카오 사용자 정보 형식이 올바르지 않습니다.');
  return profile;
};
