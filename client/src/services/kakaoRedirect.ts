// 카카오 로그인에서 돌아오면 서버가 주소 # 뒤에 결과를 붙인다.
// 읽자마자 주소에서 지워 뒤로 가기·새로고침·공유에 남지 않게 한다
export type KakaoRedirect =
  | { kind: 'login' | 'signup'; ticket: string; bind: string }
  | { kind: 'error'; reason: string };

// 로그인을 시작한 브라우저 표시. 원래 값은 이 브라우저에만 두고 서버에는 해시만 보낸다.
// 남이 받은 표를 링크로 보내도 이 값이 없으면 쓸 수 없다(로그인 CSRF 방지)
const BIND_KEY = 'kakao_login_bind';
const BIND_TTL_MS = 15 * 60 * 1000;

const toHex = (bytes: Uint8Array): string => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

export async function prepareKakaoBind(): Promise<string> {
  const bind = toHex(crypto.getRandomValues(new Uint8Array(32)));
  localStorage.setItem(BIND_KEY, JSON.stringify({ value: bind, savedAt: Date.now() }));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bind));
  return toHex(new Uint8Array(digest));
}

function takeKakaoBind(): string {
  try {
    const raw = localStorage.getItem(BIND_KEY);
    localStorage.removeItem(BIND_KEY);
    if (!raw) return '';
    const saved: unknown = JSON.parse(raw);
    if (typeof saved !== 'object' || saved === null) return '';
    const { value, savedAt } = saved as { value?: unknown; savedAt?: unknown };
    if (typeof value !== 'string' || typeof savedAt !== 'number' || Date.now() - savedAt > BIND_TTL_MS) return '';
    return value;
  } catch {
    return '';
  }
}

export function takeKakaoRedirect(): KakaoRedirect | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const login = params.get('kakao_login');
  const signup = params.get('kakao_signup');
  const error = params.get('kakao_error');
  if (!login && !signup && !error) return null;

  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  const bind = takeKakaoBind();
  if (login) return { kind: 'login', ticket: login, bind };
  if (signup) return { kind: 'signup', ticket: signup, bind };
  return { kind: 'error', reason: error ?? 'failed' };
}

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: '카카오 로그인을 취소했어요.',
  expired: '로그인 시간이 지났어요. 카카오로 다시 시작해 주세요.',
  unavailable: '지금은 카카오 로그인을 쓸 수 없어요. 이메일로 로그인해 주세요.',
};

export function kakaoErrorMessage(reason: string): string {
  // reason은 주소에서 온 값이라 'constructor' 같은 프로토타입 키를 걸러 낸다
  return Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, reason)
    ? ERROR_MESSAGES[reason]
    : '카카오 로그인을 마치지 못했어요. 잠시 후 다시 시도해 주세요.';
}
