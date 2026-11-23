/**
 * 포인트 충전 결제 (포트원 V2).
 *
 * 흐름
 *   [화면] POST /api/payments/prepare { packageId }
 *          → 서버가 주문(PaymentOrder)을 만들고 주문번호·금액·상점 정보를 돌려준다
 *   [화면] PortOne.requestPayment({ paymentId: 주문번호, totalAmount: 서버 금액 })
 *   [화면] POST /api/payments/verify { paymentId }      ← 결제 직후
 *   [포트원] POST /api/payments/webhook                 ← 결제 완료·취소 알림(브라우저가 닫혀도 온다)
 *
 * 서버가 확인하는 것
 * - 금액은 화면이 아니라 주문에 적어 둔 값이 기준이다. 실제 결제 금액이 정확히 같을 때만 지급한다.
 *   다르면 지급하지 않고 결제를 자동 취소한다.
 * - verify는 로그인한 계정의 주문만 처리한다(남의 결제번호로 자기 계정에 충전할 수 없다).
 * - 같은 결제를 verify와 웹훅이 둘 다 처리해도 포인트는 한 번만 지급된다(settleOrder).
 */
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import prisma from '../utils/prisma';
import { createUserRateLimiter } from '../utils/user-rate-limit';
import { findChargePackage } from '../services/pricing';
import { isPaidFor } from '../services/paid-mode';
import { failOrder, revokeOrder, settleOrder } from '../services/point.service';
import {
  cancelPayment,
  getPortOneConfig,
  getWebhookUrl,
  getWebhookSecrets,
  lookupPayment,
  verifyWebhookSignature,
  type PortOneConfig,
} from '../services/portone';

// 결제 준비는 주문 행을 만들므로 사용자별로 제한한다 (10분에 10번)
const allowPrepare = createUserRateLimiter(10, 10 * 60 * 1000);
// 결제 확인은 화면이 승인 대기 중 재시도하므로 넉넉히 (10분에 60번)
const allowVerify = createUserRateLimiter(60, 10 * 60 * 1000);

const PAYMENT_ID_PATTERN = /^bs_[0-9a-z]{1,10}_[0-9a-f]{16}$/;

function createPaymentId(): string {
  return `bs_${Math.floor(Date.now() / 1000).toString(36)}_${randomBytes(8).toString('hex')}`;
}

type Outcome =
  | { kind: 'paid'; fresh: boolean }
  | { kind: 'pending' }
  /** 다시 물어도 같은 판정 — 화면이 재시도를 멈춘다 */
  | { kind: 'failed'; message: string };

/**
 * 주문 하나를 포트원의 실제 결제 상태에 맞춘다. verify와 웹훅이 함께 쓴다.
 * 포트원 통신이 실패하면 예외를 던진다.
 */
async function reconcileOrder(
  order: { id: string; amount: number; status: string },
  config: PortOneConfig,
): Promise<Outcome> {
  if (order.status === 'PAID') return { kind: 'paid', fresh: false };
  if (order.status !== 'PENDING') return { kind: 'failed', message: '완료되지 않았거나 취소된 결제입니다.' };

  const payment = await lookupPayment(order.id, config.apiSecret);
  if (!payment) return { kind: 'pending' }; // 결제창을 아직 열지 않았거나 닫은 주문

  if (payment.status === 'PAID') {
    // 금액·통화뿐 아니라 결제 채널도 본다 — 같은 상점의 테스트 채널로 만든 모의 결제에 지급하지 않기 위해
    if (payment.amount !== order.amount || payment.currency !== 'KRW' || payment.channelKey !== config.channelKey) {
      console.warn(`[결제] 주문과 다른 결제라 자동 취소: paymentId=${order.id}, paid=${payment.amount} ${payment.currency}, expected=${order.amount}, channelMatch=${payment.channelKey === config.channelKey}`);
      const cancelled = await cancelPayment(order.id, config.apiSecret, '결제 내용이 주문과 달라 자동 취소');
      if (!cancelled) {
        console.error(`[결제] 자동 취소 실패 — 포트원 콘솔에서 수동 환불 필요: paymentId=${order.id}`);
      }
      await failOrder(order.id);
      return { kind: 'failed', message: '결제 내용이 주문과 달라 결제를 취소했습니다.' };
    }
    const result = await settleOrder(order.id);
    if (result === 'not-pending') return { kind: 'failed', message: '완료되지 않았거나 취소된 결제입니다.' };
    return { kind: 'paid', fresh: result === 'settled' };
  }

  if (payment.status === 'FAILED' || payment.status === 'CANCELLED') {
    await failOrder(order.id);
    // 주문을 읽은 뒤 다른 요청이 먼저 지급했을 수 있다(결제 직후 바로 취소한 경우) — 그러면 지급분을 회수한다
    if (payment.status === 'CANCELLED') await revokeIfPaid(order.id);
    return { kind: 'failed', message: '결제가 완료되지 않았습니다.' };
  }

  return { kind: 'pending' };
}

/** 지급된 주문의 결제가 취소됐을 때 포인트를 회수한다. 지급된 주문이 아니면 아무 일도 하지 않는다 */
async function revokeIfPaid(orderId: string): Promise<void> {
  const shortfall = await revokeOrder(orderId);
  if (shortfall && shortfall > 0) {
    console.warn(`[결제] 결제 취소됐으나 이미 사용한 포인트 ${shortfall}P 미회수 — 관리자 확인 필요: paymentId=${orderId}`);
  }
}

// 결제 준비: 주문 생성
export const preparePayment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    // 유료 전환 전에는 심사·점검용 계정만 충전할 수 있다 (이미 만든 주문의 확인과 웹훅은 막지 않는다)
    if (!isPaidFor(req.user.email)) {
      res.status(503).json({ error: '포인트 충전은 준비 중입니다.' });
      return;
    }

    const config = getPortOneConfig();
    if (!config) {
      res.status(503).json({ error: '결제 준비 중입니다. 잠시 후 다시 이용해주세요.' });
      return;
    }

    const chargePackage = findChargePackage(req.body?.packageId);
    if (!chargePackage) {
      res.status(400).json({ error: '충전 금액을 다시 선택해주세요.' });
      return;
    }

    if (!allowPrepare(req.user.userId)) {
      res.status(429).json({ error: '결제 요청이 너무 많아요. 10분 뒤에 다시 시도해주세요.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { id: true } });
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const order = await prisma.paymentOrder.create({
      data: { id: createPaymentId(), userId: user.id, amount: chargePackage.amount, points: chargePackage.points },
    });

    res.json({
      success: true,
      data: {
        paymentId: order.id,
        amount: order.amount,
        points: order.points,
        orderName: `별사탕 포인트 ${order.points.toLocaleString('ko-KR')}P`,
        storeId: config.storeId,
        channelKey: config.channelKey,
        payMethod: config.payMethod,
        noticeUrl: getWebhookUrl(),
      },
    });
  } catch (error) {
    console.error('결제 준비 오류:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: '결제 준비 중 오류가 발생했습니다.' });
  }
};

// 결제 확인: 결제 직후 화면이 부른다
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const config = getPortOneConfig();
    if (!config) {
      res.status(503).json({ error: '결제 준비 중입니다. 잠시 후 다시 이용해주세요.' });
      return;
    }

    const paymentId: unknown = req.body?.paymentId;
    if (typeof paymentId !== 'string' || !PAYMENT_ID_PATTERN.test(paymentId)) {
      res.status(400).json({ error: '결제 정보가 올바르지 않습니다.', final: true });
      return;
    }

    if (!allowVerify(req.user.userId)) {
      res.status(429).json({ error: '확인 요청이 너무 많아요. 잠시 후 다시 시도해주세요.' });
      return;
    }

    // 로그인한 계정의 주문만 — 남의 결제번호는 "없는 주문"과 같은 응답을 준다
    const order = await prisma.paymentOrder.findFirst({ where: { id: paymentId, userId: req.user.userId } });
    if (!order) {
      res.status(404).json({ error: '결제 정보를 찾을 수 없습니다.', final: true });
      return;
    }

    const outcome = await reconcileOrder(order, config);
    if (outcome.kind === 'pending') {
      res.status(202).json({ success: false, pending: true, error: '결제 승인을 기다리고 있어요.' });
      return;
    }
    if (outcome.kind === 'failed') {
      res.status(400).json({ error: outcome.message, final: true });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { points: true } });
    res.json({ success: true, data: { points: user?.points ?? 0, charged: order.points } });
  } catch (error) {
    // 포트원 통신 오류·DB 오류 — 결제는 됐을 수 있으므로 화면이 재시도한다(final 아님)
    console.error('결제 확인 오류:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: '결제 확인 중 오류가 발생했습니다. 잠시 후 자동으로 다시 확인합니다.' });
  }
};

// 포트원 웹훅: 결제 완료·취소 알림. 로그인 없이 호출되는 공개 주소다.
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const config = getPortOneConfig();
    if (!config) {
      res.status(503).json({ error: 'payment not configured' });
      return;
    }

    // 서명 확인. 누구나 호출할 수 있는 주소라 시크릿이 없으면 받지 않는다.
    // 로컬 개발에서만 ALLOW_UNSIGNED_WEBHOOK=1 로 서명 없이 받을 수 있다.
    const secrets = getWebhookSecrets();
    if (secrets.length > 0) {
      const verified = verifyWebhookSignature((req as Request & { rawBody?: string }).rawBody, req.headers, secrets);
      if (!verified.ok) {
        console.warn(`[웹훅] 서명 거부: ${verified.reason}`);
        res.status(401).json({ error: 'invalid signature' });
        return;
      }
    } else if (process.env.ALLOW_UNSIGNED_WEBHOOK !== '1') {
      console.error('[웹훅] PORTONE_WEBHOOK_SECRET 미설정 — 웹훅을 받지 않음');
      res.status(503).json({ error: 'webhook secret not configured' });
      return;
    }

    const paymentId: unknown = req.body?.data?.paymentId;
    // 우리가 발급한 주문번호가 아니면(같은 상점의 다른 결제 등) 조용히 넘긴다
    if (typeof paymentId !== 'string' || !PAYMENT_ID_PATTERN.test(paymentId)) {
      res.json({ success: true });
      return;
    }

    const order = await prisma.paymentOrder.findUnique({ where: { id: paymentId } });
    if (!order) {
      res.json({ success: true });
      return;
    }

    // 본문의 이벤트 종류는 믿지 않고 포트원의 실제 결제 상태로 판단한다
    if (order.status === 'PAID') {
      const payment = await lookupPayment(order.id, config.apiSecret);
      if (payment?.status === 'CANCELLED') {
        await revokeIfPaid(order.id);
      } else if (payment?.status === 'PARTIAL_CANCELLED') {
        // 부분 취소는 얼마를 회수할지 자동으로 정하지 않는다 — 관리자가 확인한다
        console.warn(`[웹훅] 부분 취소된 결제 — 포인트 회수는 관리자 확인 필요: paymentId=${order.id}`);
      }
    } else {
      await reconcileOrder(order, config);
    }

    res.json({ success: true });
  } catch (error) {
    // 500을 돌려주면 포트원이 다시 보낸다
    console.error('웹훅 처리 오류:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'webhook processing failed' });
  }
};
