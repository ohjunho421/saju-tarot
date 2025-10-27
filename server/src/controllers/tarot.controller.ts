import { Request, Response } from 'express';
import { TarotService } from '../services/tarot.service';
import { SpreadType } from '../models/tarot.model';

const tarotService = new TarotService();

export const drawCards = (req: Request, res: Response) => {
  try {
    const { spreadType, question } = req.body as { spreadType: SpreadType; question?: string };

    if (!spreadType) {
      return res.status(400).json({ error: '스프레드 타입이 필요합니다.' });
    }

    const drawnCards = tarotService.drawCards(spreadType, question);
    const interpretation = tarotService.generateBasicInterpretation(drawnCards, spreadType);
    const advice = tarotService.generateAdvice(drawnCards);

    res.json({
      success: true,
      data: {
        spreadType,
        question,
        drawnCards,
        interpretation,
        advice
      }
    });
  } catch (error) {
    console.error('Tarot draw error:', error);
    res.status(500).json({ 
      success: false, 
      error: '타로 카드 추첨 중 오류가 발생했습니다.' 
    });
  }
};

export const getAllCards = (req: Request, res: Response) => {
  try {
    const cards = tarotService.getAllCards();
    res.json({
      success: true,
      data: cards
    });
  } catch (error) {
    console.error('Get cards error:', error);
    res.status(500).json({ 
      success: false, 
      error: '카드 목록을 가져오는 중 오류가 발생했습니다.' 
    });
  }
};
