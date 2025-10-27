import { Request, Response } from 'express';
import { SajuService } from '../services/saju.service';
import { BirthInfo } from '../models/saju.model';

const sajuService = new SajuService();

export const analyzeSaju = (req: Request, res: Response) => {
  try {
    const birthInfo: BirthInfo = req.body;

    // 유효성 검사
    if (!birthInfo.year || !birthInfo.month || !birthInfo.day || birthInfo.hour === undefined) {
      return res.status(400).json({ error: '생년월일시 정보가 필요합니다.' });
    }

    const analysis = sajuService.analyzeSaju(birthInfo);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Saju analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: '사주 분석 중 오류가 발생했습니다.' 
    });
  }
};
