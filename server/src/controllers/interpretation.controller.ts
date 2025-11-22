import { Request, Response } from 'express';
import { SajuService } from '../services/saju.service';
import { TarotService } from '../services/tarot.service';
import { InterpretationService } from '../services/interpretation.service';
import { BirthInfo } from '../models/saju.model';
import { SpreadType } from '../models/tarot.model';

const sajuService = new SajuService();
const tarotService = new TarotService();
const interpretationService = new InterpretationService();

export const getIntegratedReading = (req: Request, res: Response) => {
  try {
    const { birthInfo, spreadType, question, cardPositions } = req.body as {
      birthInfo: BirthInfo;
      spreadType: SpreadType;
      question?: string;
      cardPositions?: number[];
    };

    // 유효성 검사
    if (!birthInfo || !spreadType) {
      return res.status(400).json({ error: '생년월일시와 스프레드 타입이 필요합니다.' });
    }

    // 사주 분석
    const sajuAnalysis = sajuService.analyzeSaju(birthInfo);

    // 타로 카드 뽑기 (사용자가 선택한 카드)
    const drawnCards = tarotService.drawCards(spreadType, question, false, cardPositions);

    // 통합 해석
    const integrated = interpretationService.integrateInterpretation(
      sajuAnalysis,
      drawnCards,
      spreadType
    );

    res.json({
      success: true,
      data: {
        sajuAnalysis,
        drawnCards,
        spreadType,
        question,
        ...integrated
      }
    });
  } catch (error) {
    console.error('Integrated reading error:', error);
    res.status(500).json({ 
      success: false, 
      error: '통합 해석 중 오류가 발생했습니다.' 
    });
  }
};
