/**
 * 포인트 잔액 변경은 전부 여기를 거친다.
 * - 잔액(User.points) 변경과 거래 내역(PointTransaction) 기록을 한 DB 트랜잭션으로 묶는다.
 * - 차감은 "잔액이 충분할 때만" 한 번의 UPDATE로 처리해, 동시에 두 번 요청해도 잔액이 음수가 되지 않는다.
 */
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { SIGNUP_BONUS_POINTS, todayKst } from './pricing';

type Tx = Prisma.TransactionClient;

export class InsufficientPointsError extends Error {
  constructor(public readonly required: number, public readonly balance: number) {
    super('포인트가 부족합니다.');
  }
}

async function addPoints(
  tx: Tx,
  userId: string,
  amount: number,
  type: 'charge' | 'refund',
  description: string,
  refs: { orderId?: string; readingId?: string } = {},
): Promise<number> {
  const user = await tx.user.update({
    where: { id: userId },
    data: { points: { increment: amount } },
    select: { points: true },
  });
  await tx.pointTransaction.create({
    data: { userId, type, amount, balance: user.points, description, ...refs },
  });
  return user.points;
}

/** 가입 축하 포인트 — 회원 생성과 같은 트랜잭션에서 부른다 */
export async function grantSignupBonus(tx: Tx, userId: string): Promise<number> {
  return addPoints(tx, userId, SIGNUP_BONUS_POINTS, 'charge', '가입 축하 포인트');
}

/**
 * 리딩 요금 차감. 잔액이 모자라면 InsufficientPointsError.
 * @returns 차감 후 잔액과 거래 내역 id (리딩이 실패하면 이 id로 환불한다)
 */
export async function spendPoints(
  userId: string,
  cost: number,
  description: string,
): Promise<{ balance: number; transactionId: string }> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: { id: userId, points: { gte: cost } },
      data: { points: { decrement: cost } },
    });
    const user = await tx.user.findUnique({ where: { id: userId }, select: { points: true } });
    if (updated.count === 0) {
      throw new InsufficientPointsError(cost, user?.points ?? 0);
    }
    const balance = user?.points ?? 0;
    const record = await tx.pointTransaction.create({
      data: { userId, type: 'use', amount: -cost, balance, description },
    });
    return { balance, transactionId: record.id };
  });
}

/** 차감한 리딩이 실패했을 때 되돌린다 */
export async function refundSpend(userId: string, cost: number, description: string): Promise<number> {
  return prisma.$transaction((tx) => addPoints(tx, userId, cost, 'refund', description));
}

/** 차감 내역에 완성된 리딩을 연결한다 (실패해도 리딩 응답은 막지 않는다) */
export async function linkSpendToReading(transactionId: string, readingId: string): Promise<void> {
  await prisma.pointTransaction.update({ where: { id: transactionId }, data: { readingId } });
}

/**
 * 오늘의 무료 리딩을 차지한다. 이미 썼으면 false.
 * 유니크 제약으로 판정과 기록을 한 번에 해서, 같은 요청을 동시에 여러 개 보내도 하나만 무료가 된다.
 */
export async function claimDailyFree(userId: string, spreadType: string): Promise<boolean> {
  try {
    await prisma.dailyFreeUse.create({ data: { userId, spreadType, day: todayKst() } });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false;
    throw e;
  }
}

/** 무료로 시작한 리딩이 실패했을 때 오늘의 무료를 되돌린다 */
export async function releaseDailyFree(userId: string, spreadType: string): Promise<void> {
  await prisma.dailyFreeUse.deleteMany({ where: { userId, spreadType, day: todayKst() } });
}

export type SettleResult = 'settled' | 'already' | 'not-pending';

/**
 * 결제 완료된 주문에 포인트를 지급한다.
 * 결제 확인(verify)과 웹훅이 같은 결제를 동시에 처리해도 PENDING → PAID 전환은 한 번만 일어난다.
 */
export async function settleOrder(orderId: string): Promise<SettleResult> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.paymentOrder.updateMany({
      where: { id: orderId, status: 'PENDING' },
      data: { status: 'PAID', paidAt: new Date() },
    });
    if (claimed.count === 0) {
      const order = await tx.paymentOrder.findUnique({ where: { id: orderId }, select: { status: true } });
      return order?.status === 'PAID' ? 'already' : 'not-pending';
    }
    const order = await tx.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
    await addPoints(tx, order.userId, order.points, 'charge', `포인트 충전 ${order.amount.toLocaleString('ko-KR')}원`, {
      orderId,
    });
    return 'settled';
  });
}

/** 결제가 끝내 완료되지 않은 주문을 닫는다 (PENDING일 때만) */
export async function failOrder(orderId: string): Promise<void> {
  await prisma.paymentOrder.updateMany({ where: { id: orderId, status: 'PENDING' }, data: { status: 'FAILED' } });
}

/**
 * 결제가 취소(환불)됐을 때 지급했던 포인트를 회수한다.
 * 이미 써 버려서 잔액이 모자라면 남은 만큼만 회수하고, 부족분을 주문의 shortfall에 적어 둔다(관리자 확인용).
 * @returns 회수하지 못한 포인트. 회수할 주문이 아니면 null
 */
export async function revokeOrder(orderId: string): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.paymentOrder.updateMany({
      where: { id: orderId, status: 'PAID' },
      data: { status: 'CANCELLED' },
    });
    if (claimed.count === 0) return null;

    const order = await tx.paymentOrder.findUniqueOrThrow({ where: { id: orderId } });
    // 잔액 행을 잠근 뒤 읽는다 — 읽고 빼는 사이에 리딩 차감이 끼어들어 잔액이 음수가 되지 않게
    const locked = await tx.$queryRaw<{ points: number }[]>`SELECT "points" FROM "User" WHERE "id" = ${order.userId} FOR UPDATE`;
    const current = locked[0]?.points ?? 0;
    const take = Math.min(current, order.points);
    const after = await tx.user.update({
      where: { id: order.userId },
      data: { points: { decrement: take } },
      select: { points: true },
    });
    await tx.pointTransaction.create({
      data: {
        userId: order.userId,
        type: 'refund',
        amount: -take,
        balance: after.points,
        description: '결제 취소로 포인트 회수',
        orderId,
      },
    });
    if (order.points > take) {
      await tx.paymentOrder.update({ where: { id: orderId }, data: { shortfall: order.points - take } });
    }
    return order.points - take;
  });
}
