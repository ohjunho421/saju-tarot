import { Request, Response } from 'express';
import { getAIService } from '../services/ai.service';

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

    const aiService = getAIService();
    const answer = await aiService.chatAboutReading(question, reading, chatHistory || []);

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
