import prisma from '../utils/prisma';
import { getRequiredPoints } from '../config/payment.config';

export class PointService {
  // 사용자 포인트 조회
  async getUserPoints(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { points: true }
    });
    return user?.points || 0;
  }

  // 포인트 충전
  async chargePoints(
    userId: string,
    amount: number,
    orderId: string,
    description: string
  ): Promise<{ success: boolean; balance: number; error?: string }> {
    try {
      // 이미 처리된 주문인지 확인 (중복 방지)
      const existingTransaction = await prisma.pointTransaction.findFirst({
        where: { orderId }
      });

      if (existingTransaction) {
        return { 
          success: false, 
          balance: await this.getUserPoints(userId),
          error: '이미 처리된 주문입니다.' 
        };
      }

      // 트랜잭션으로 포인트 충전
      const result = await prisma.$transaction(async (tx) => {
        // 현재 잔액 조회
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { points: true }
        });

        const currentBalance = user?.points || 0;
        const newBalance = currentBalance + amount;

        // 포인트 업데이트
        await tx.user.update({
          where: { id: userId },
          data: { points: newBalance }
        });

        // 거래 내역 생성
        await tx.pointTransaction.create({
          data: {
            userId,
            type: 'charge',
            amount,
            balance: newBalance,
            description,
            orderId
          }
        });

        return newBalance;
      });

      return { success: true, balance: result };
    } catch (error) {
      console.error('포인트 충전 오류:', error);
      return { 
        success: false, 
        balance: await this.getUserPoints(userId),
        error: '포인트 충전 중 오류가 발생했습니다.' 
      };
    }
  }

  // 포인트 사용 (해석 열람)
  async usePoints(
    userId: string,
    spreadType: string,
    readingId?: string
  ): Promise<{ success: boolean; balance: number; error?: string }> {
    const requiredPoints = getRequiredPoints(spreadType);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 현재 잔액 조회
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { points: true }
        });

        const currentBalance = user?.points || 0;

        // 잔액 부족 체크
        if (currentBalance < requiredPoints) {
          throw new Error('INSUFFICIENT_POINTS');
        }

        const newBalance = currentBalance - requiredPoints;

        // 포인트 차감
        await tx.user.update({
          where: { id: userId },
          data: { points: newBalance }
        });

        // 거래 내역 생성
        await tx.pointTransaction.create({
          data: {
            userId,
            type: 'use',
            amount: -requiredPoints,
            balance: newBalance,
            description: `타로 해석 열람 (${spreadType})`,
            readingId
          }
        });

        return newBalance;
      });

      return { success: true, balance: result };
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_POINTS') {
        return {
          success: false,
          balance: await this.getUserPoints(userId),
          error: '포인트가 부족합니다.'
        };
      }
      console.error('포인트 사용 오류:', error);
      return {
        success: false,
        balance: await this.getUserPoints(userId),
        error: '포인트 사용 중 오류가 발생했습니다.'
      };
    }
  }

  // 포인트 환불
  async refundPoints(
    userId: string,
    amount: number,
    description: string
  ): Promise<{ success: boolean; balance: number }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { points: true }
        });

        const currentBalance = user?.points || 0;
        const newBalance = currentBalance + amount;

        await tx.user.update({
          where: { id: userId },
          data: { points: newBalance }
        });

        await tx.pointTransaction.create({
          data: {
            userId,
            type: 'refund',
            amount,
            balance: newBalance,
            description
          }
        });

        return newBalance;
      });

      return { success: true, balance: result };
    } catch (error) {
      console.error('포인트 환불 오류:', error);
      return { success: false, balance: await this.getUserPoints(userId) };
    }
  }

  // 포인트 거래 내역 조회
  async getTransactionHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const [transactions, total] = await Promise.all([
      prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.pointTransaction.count({ where: { userId } })
    ]);

    return { transactions, total, hasMore: offset + transactions.length < total };
  }

  // 포인트 충분 여부 확인
  async hasEnoughPoints(userId: string, spreadType: string): Promise<boolean> {
    const requiredPoints = getRequiredPoints(spreadType);
    const currentPoints = await this.getUserPoints(userId);
    return currentPoints >= requiredPoints;
  }
}

export const pointService = new PointService();
