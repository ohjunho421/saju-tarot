/**
 * 포트원 V2 API 호출과 웹훅 서명 검증.
 *
 * 환경변수
 * - PORTONE_API_SECRET     : 결제 조회·취소용 서버 키 (없으면 결제 기능이 꺼진다)
 * - PORTONE_STORE_ID       : 상점 ID (결제창에 넘긴다)
 * - PORTONE_CHANNEL_KEY    : 결제 채널 키 (결제창에 넘긴다)
 * - PORTONE_PAY_METHOD     : 채널의 결제수단. CARD(기본, 카드 결제사) 또는 EASY_PAY(카카오페이·토스페이 등 간편결제 채널)
 * - PORTONE_WEBHOOK_SECRET : 웹훅 시크릿 whsec_... (교체 중에는 쉼표로 두 개까지)
 *
 * 자세한 규칙: docs/features/payment.md
 */
import { createHmac, timingSafeEqual } from 'crypto';
import type { IncomingMessage } from 'http';

const PORTONE_API_BASE = 'https://api.portone.io';
const REQUEST_TIMEOUT_MS = 10_000;

export const WEBHOOK_PATH = '/api/payments/webhook';
const WEBHOOK_TOLERANCE_SEC = 5 * 60;

export type PayMethod = 'CARD' | 'EASY_PAY';

export interface PortOneConfig {
  apiSecret: string;
  storeId: string;
  channelKey: string;
  payMethod: PayMethod;
}

/** 결제에 필요한 설정이 모두 있을 때만 돌려준다 */
export function getPortOneConfig(): PortOneConfig | null {
  const apiSecret = process.env.PORTONE_API_SECRET;
  const storeId = process.env.PORTONE_STORE_ID;
  const channelKey = process.env.PORTONE_CHANNEL_KEY;
  if (!apiSecret || !storeId || !channelKey) return null;
  const payMethod: PayMethod = (process.env.PORTONE_PAY_METHOD ?? '').trim().toUpperCase() === 'EASY_PAY' ? 'EASY_PAY' : 'CARD';
  return { apiSecret, storeId, channelKey, payMethod };
}

/**
 * 결제마다 지정하는 웹훅 주소(noticeUrls). 같은 포트원 상점을 블로그치트키와 함께 쓰므로
 * 콘솔의 상점 공통 웹훅에 기대지 않고 결제 요청에 직접 넣는다.
 * PORTONE_WEBHOOK_URL이 없으면 카카오·구글 콜백 주소의 서버에서 만든다. 운영에서는 https만
 */
export function getWebhookUrl(): string | null {
  const explicit = process.env.PORTONE_WEBHOOK_URL;
  const base = explicit ?? [process.env.KAKAO_REDIRECT_URI, process.env.GOOGLE_REDIRECT_URI]
    .map((value) => {
      try {
        return value ? new URL(value).origin : null;
      } catch {
        return null;
      }
    })
    .find((value): value is string => Boolean(value));
  if (!base) return null;
  let url: URL;
  try {
    url = new URL(explicit ? base : `${base}/api/payments/webhook`);
  } catch {
    return null;
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') return null;
  return url.toString();
}

export interface PortOnePayment {
  status: string; // 'READY' | 'PAID' | 'FAILED' | 'CANCELLED' | 'PARTIAL_CANCELLED' | 'PAY_PENDING' | 'VIRTUAL_ACCOUNT_ISSUED'
  amount: number;
  currency: string | null;
  /** 결제가 이뤄진 채널 키 — 우리가 설정한 채널로 결제됐는지 확인한다 */
  channelKey: string | null;
}

async function portoneFetch(path: string, apiSecret: string, init: { method: string; body?: unknown }): Promise<Response> {
  return fetch(`${PORTONE_API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `PortOne ${apiSecret}`,
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

/**
 * 결제 단건 조회. 포트원에 그 결제가 없으면 null.
 * 통신 실패·5xx는 예외로 던진다 (호출부가 "잠시 후 다시"로 처리).
 */
export async function lookupPayment(paymentId: string, apiSecret: string): Promise<PortOnePayment | null> {
  const res = await portoneFetch(`/payments/${encodeURIComponent(paymentId)}`, apiSecret, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`포트원 결제 조회 실패: HTTP ${res.status}`);
  // 응답 전체에는 결제자 이름·이메일·전화번호가 들어 있어 필요한 값만 꺼낸다
  const data = (await res.json()) as {
    status?: unknown;
    amount?: { total?: unknown };
    currency?: unknown;
    channel?: { key?: unknown };
  };
  return {
    status: typeof data.status === 'string' ? data.status : 'UNKNOWN',
    amount: typeof data.amount?.total === 'number' ? data.amount.total : 0,
    currency: typeof data.currency === 'string' ? data.currency : null,
    channelKey: typeof data.channel?.key === 'string' ? data.channel.key : null,
  };
}

/** 결제 전액 취소. 성공 여부만 돌려준다 */
export async function cancelPayment(paymentId: string, apiSecret: string, reason: string): Promise<boolean> {
  try {
    const res = await portoneFetch(`/payments/${encodeURIComponent(paymentId)}/cancel`, apiSecret, {
      method: 'POST',
      body: { reason },
    });
    if (!res.ok) console.error(`[결제] 취소 실패: paymentId=${paymentId}, HTTP ${res.status}`);
    return res.ok;
  } catch (error) {
    console.error(`[결제] 취소 요청 오류: paymentId=${paymentId}`, error instanceof Error ? error.message : error);
    return false;
  }
}

// ---------- 웹훅 서명 검증 (Standard Webhooks 규격, 포트원 공식 SDK와 같은 계산) ----------

export function getWebhookSecrets(): string[] {
  return (process.env.PORTONE_WEBHOOK_SECRET ?? '').split(/[\s,]+/).filter(Boolean);
}

/**
 * express.json()의 verify 옵션. 웹훅 경로만 받은 본문 원문을 req.rawBody에 남긴다
 * (서명은 원문 기준이라 파싱 후 다시 만든 JSON으로는 검증할 수 없다).
 */
export function captureWebhookRawBody(req: IncomingMessage, _res: unknown, buf: Buffer): void {
  const url = String((req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url ?? '');
  const path = url.split('?')[0].toLowerCase().replace(/\/+$/, '');
  if (path === WEBHOOK_PATH) {
    (req as IncomingMessage & { rawBody?: string }).rawBody = buf.toString('utf8');
  }
}

function headerValue(headers: IncomingMessage['headers'], name: string): string | undefined {
  const v = headers[name];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

function keyFromSecret(secret: string): Buffer | null {
  const base64 = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) return null;
  const key = Buffer.from(base64, 'base64');
  return key.length > 0 ? key : null;
}

/** 포트원이 서명한 요청인지 확인한다. 실패하면 이유(로그용)를 돌려준다 */
export function verifyWebhookSignature(
  rawBody: string | undefined,
  headers: IncomingMessage['headers'],
  secrets: string[],
  nowSec: number = Math.floor(Date.now() / 1000),
): { ok: true } | { ok: false; reason: string } {
  if (typeof rawBody !== 'string') return { ok: false, reason: 'NO_RAW_BODY' };

  const id = headerValue(headers, 'webhook-id');
  const timestamp = headerValue(headers, 'webhook-timestamp');
  const signatures = headerValue(headers, 'webhook-signature');
  if (!id || !timestamp || !signatures) return { ok: false, reason: 'MISSING_HEADERS' };

  if (!/^\d+$/.test(timestamp)) return { ok: false, reason: 'INVALID_TIMESTAMP' };
  const ts = Number(timestamp);
  if (Math.abs(nowSec - ts) > WEBHOOK_TOLERANCE_SEC) return { ok: false, reason: 'TIMESTAMP_OUT_OF_RANGE' };

  const keys = secrets.map(keyFromSecret).filter((k): k is Buffer => k !== null);
  if (keys.length === 0) return { ok: false, reason: 'INVALID_SECRET_CONFIG' };

  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = keys.map((key) => createHmac('sha256', key).update(signedContent, 'utf8').digest());

  for (const versioned of signatures.split(' ')) {
    const [version, signature] = versioned.split(',', 2);
    if (version !== 'v1' || !signature) continue;
    const given = Buffer.from(signature, 'base64');
    if (expected.some((e) => e.length === given.length && timingSafeEqual(e, given))) return { ok: true };
  }
  return { ok: false, reason: 'NO_MATCHING_SIGNATURE' };
}
