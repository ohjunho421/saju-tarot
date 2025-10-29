import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 타로 리딩 저장
export const saveReading = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const {
      question,
      spreadType,
      drawnCards,
      interpretation,
      elementalHarmony,
      personalizedAdvice,
      adviceCardInterpretation,
      aiProvider
    } = req.body;

    if (!question || !spreadType || !drawnCards || !interpretation) {
      return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
    }

    const reading = await prisma.reading.create({
      data: {
        userId,
        question,
        spreadType,
        drawnCards,
        interpretation,
        elementalHarmony: elementalHarmony || '',
        personalizedAdvice: personalizedAdvice || '',
        adviceCardInterpretation: adviceCardInterpretation || null,
        aiProvider: aiProvider || null
      }
    });

    res.json({ success: true, readingId: reading.id });
  } catch (error) {
    console.error('리딩 저장 오류:', error);
    res.status(500).json({ error: '리딩 저장 중 오류가 발생했습니다.' });
  }
};

// 사용자의 타로 리딩 내역 조회
export const getUserReadings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { limit = '10', offset = '0' } = req.query;

    const readings = await prisma.reading.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        question: true,
        spreadType: true,
        drawnCards: true,
        interpretation: true,
        elementalHarmony: true,
        personalizedAdvice: true,
        adviceCardInterpretation: true,
        aiProvider: true,
        createdAt: true
      }
    });

    const total = await prisma.reading.count({ where: { userId } });

    res.json({
      readings,
      total,
      hasMore: parseInt(offset as string) + readings.length < total
    });
  } catch (error) {
    console.error('리딩 내역 조회 오류:', error);
    res.status(500).json({ error: '리딩 내역 조회 중 오류가 발생했습니다.' });
  }
};

// 특정 리딩 상세 조회
export const getReadingById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const reading = await prisma.reading.findFirst({
      where: {
        id,
        userId // 본인의 리딩만 조회 가능
      }
    });

    if (!reading) {
      return res.status(404).json({ error: '리딩을 찾을 수 없습니다.' });
    }

    res.json(reading);
  } catch (error) {
    console.error('리딩 조회 오류:', error);
    res.status(500).json({ error: '리딩 조회 중 오류가 발생했습니다.' });
  }
};

// 최근 리딩 컨텍스트 조회 (AI 해석용)
export const getRecentContext = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const { limit = '5' } = req.query;

    // 최근 N개의 질문과 요약만 가져오기
    const recentReadings = await prisma.reading.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      select: {
        question: true,
        spreadType: true,
        createdAt: true,
        interpretation: true
      }
    });

    // AI에게 전달할 요약 컨텍스트 생성
    const context = recentReadings.map(r => ({
      date: r.createdAt.toISOString().split('T')[0],
      question: r.question,
      spreadType: r.spreadType,
      // 해석의 첫 200자만 요약으로
      summary: r.interpretation.substring(0, 200) + (r.interpretation.length > 200 ? '...' : '')
    }));

    res.json({ context });
  } catch (error) {
    console.error('컨텍스트 조회 오류:', error);
    res.status(500).json({ error: '컨텍스트 조회 중 오류가 발생했습니다.' });
  }
};

// 리딩 삭제
export const deleteReading = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }

    const reading = await prisma.reading.findFirst({
      where: { id, userId }
    });

    if (!reading) {
      return res.status(404).json({ error: '리딩을 찾을 수 없습니다.' });
    }

    await prisma.reading.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('리딩 삭제 오류:', error);
    res.status(500).json({ error: '리딩 삭제 중 오류가 발생했습니다.' });
  }
};
