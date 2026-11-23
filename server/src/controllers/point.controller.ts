import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getPriceTable, todayKst } from '../services/pricing';
import { isPaidFor, isPaidModeOn } from '../services/paid-mode';
import type { SpreadType } from '../models/tarot.model';

const HISTORY_LIMIT = 50;

// 가격표 (로그인 없이 볼 수 있다 — 결제사 심사·가격 안내 화면용)
export const getPrices = (_req: Request, res: Response): void => {
  // paidMode: 요금이 모든 회원에게 적용 중인가 (요금 안내 화면의 "준비 중" 안내용)
  res.json({ success: true, data: { ...getPriceTable(), paidMode: isPaidModeOn() } });
};

// 내 잔액 + 오늘 무료 리딩을 이미 쓴 스프레드
export const getMyPoints = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const [user, freeUses] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.userId }, select: { points: true } }),
      prisma.dailyFreeUse.findMany({
        where: { userId: req.user.userId, day: todayKst() },
        select: { spreadType: true },
      }),
    ]);

    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    const usedFreeToday = freeUses.map((use) => use.spreadType as SpreadType);

    // paid: 이 회원에게 요금·충전이 적용되는가 (화면이 잔액·요금 표시를 켜고 끄는 기준)
    res.json({ success: true, data: { points: user.points, usedFreeToday, paid: isPaidFor(req.user.email) } });
  } catch (error) {
    console.error('포인트 조회 오류:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: '포인트 조회 중 오류가 발생했습니다.' });
  }
};

// 내 포인트 내역 (최근 50건)
export const getMyPointHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const transactions = await prisma.pointTransaction.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_LIMIT,
      select: { id: true, type: true, amount: true, balance: true, description: true, createdAt: true },
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('포인트 내역 조회 오류:', error instanceof Error ? error.message : error);
    res.status(500).json({ error: '포인트 내역 조회 중 오류가 발생했습니다.' });
  }
};
