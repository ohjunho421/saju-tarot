// 구글 로그인 (OAuth 2.0 인가 코드 방식)
// 문서: https://developers.google.com/identity/protocols/oauth2/web-server
// 카카오와 같은 수준으로 구글 계정 식별번호(sub)와 이름만 받는다. 이메일은 요청하지 않는다
// (이메일 가입 계정과 이메일로 엮지 않으므로 필요 없고, 받는 개인정보를 줄인다)
import { isRecord } from './kakao.service';

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USER_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const REQUEST_TIMEOUT_MS = 10_000;

export interface GoogleProfile {
  googleId: string;
  nickname: string; // 이름이 없으면 빈 문자열
}

interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

const getConfig = (): GoogleConfig | null => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
};

export const isGoogleConfigured = (): boolean => getConfig() !== null;

export const buildGoogleAuthorizeUrl = (state: string): string | null => {
  const config = getConfig();
  if (!config) return null;
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid profile',
    state,
    prompt: 'select_account',
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
};

const exchangeCode = async (config: GoogleConfig, code: string): Promise<string> => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
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
    const errorCode = isRecord(data) ? data.error : undefined;
    throw new Error(`구글 토큰 요청 실패 (${response.status}${errorCode ? `, ${String(errorCode)}` : ''})`);
  }
  return accessToken;
};

// 구글 사용자 정보에서 식별번호와 이름만 골라 낸다
export const parseGoogleUser = (data: unknown): GoogleProfile | null => {
  if (!isRecord(data) || typeof data.sub !== 'string' || data.sub.length === 0) return null;
  // 글자 단위로 자른다(이모지를 반으로 자르면 깨진 문자가 남는다)
  const nickname = typeof data.name === 'string' ? Array.from(data.name.trim()).slice(0, 30).join('') : '';
  return { googleId: data.sub, nickname };
};

export const fetchGoogleProfile = async (code: string): Promise<GoogleProfile> => {
  const config = getConfig();
  if (!config) throw new Error('구글 로그인이 설정되지 않았습니다.');
  const accessToken = await exchangeCode(config, code);
  const response = await fetch(USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`구글 사용자 정보 요청 실패 (${response.status})`);
  const profile = parseGoogleUser(await response.json());
  if (!profile) throw new Error('구글 사용자 정보 형식이 올바르지 않습니다.');
  return profile;
};
