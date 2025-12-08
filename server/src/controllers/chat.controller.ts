import { Request, Response } from 'express';
import { getAIService } from '../services/ai.service';
import prisma from '../utils/prisma';

export const chatWithReading = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { question, reading, chatHistory } = req.body;

    if (!question || !question.trim()) {
      res.status(400).json({ error: '질문을 입력해주세요.' });
      return;
    }

    if (!reading) {
      res.status(400).json({ error: '리딩 정보가 필요합니다.' });
      return;
    }

    // 사용자 이름 조회
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true }
    });

    console.log('📝 Chat 요청:', { question, userName: user?.name });
    console.log('📊 Reading 데이터:', JSON.stringify(reading, null, 2).substring(0, 500));
    
    const aiService = getAIService();
    const answer = await aiService.chatAboutReading(
      question, 
      reading, 
      chatHistory || [],
      user?.name || undefined
    );
    
    console.log('✅ Chat 응답 생성 완료:', answer?.substring(0, 100));

    res.json({
      success: true,
      data: {
        answer
      }
    });
  } catch (error) {
    console.error('Chat 오류:', error);
    res.status(500).json({ error: '답변 생성 중 오류가 발생했습니다.' });
  }
};
