import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { SajuService } from '../services/saju.service';
import { generateToken } from '../utils/jwt';
import type { BirthInfo } from '../models/saju.model';

const sajuService = new SajuService();

// 회원가입
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, birthInfo, mbti }: {
      email: string;
      password: string;
      name: string;
      birthInfo: BirthInfo;
      mbti?: string;
    } = req.body;

    const validMbtis = [
      'INTJ', 'INTP', 'ENTJ', 'ENTP',
      'INFJ', 'INFP', 'ENFJ', 'ENFP',
      'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
      'ISTP', 'ISFP', 'ESTP', 'ESFP'
    ];

    // 유효성 검사
    if (!email || !password || !name || !birthInfo) {
      res.status(400).json({ error: '모든 필드를 입력해주세요.' });
      return;
    }

    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      res.status(400).json({ error: '이미 가입된 이메일입니다.' });
      return;
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사주 분석
    const sajuAnalysis = sajuService.analyzeSaju(birthInfo);

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        birthInfo: birthInfo as any,
        sajuAnalysis: sajuAnalysis as any,
        ...(mbti && validMbtis.includes(mbti.toUpperCase()) ? { mbti: mbti.toUpperCase() } : {})
      }
    });

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          birthInfo: user.birthInfo,
          sajuAnalysis: user.sajuAnalysis
        }
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
};

// 로그인
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    // 유효성 검사
    if (!email || !password) {
      res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
      return;
    }

    // 사용자 찾기
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
      return;
    }

    // 마지막 로그인 시간 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // 기존 사용자의 sajuAnalysis에 sal 필드가 없으면 재계산 후 DB 업데이트
    let sajuAnalysis = user.sajuAnalysis;
    const existingSaju = sajuAnalysis as any;
    if (user.birthInfo && existingSaju && !existingSaju.sal) {
      try {
        const freshAnalysis = sajuService.analyzeSaju(user.birthInfo as any);
        await prisma.user.update({
          where: { id: user.id },
          data: { sajuAnalysis: freshAnalysis as any }
        });
        sajuAnalysis = freshAnalysis as any;
      } catch (e) {
        console.error('로그인 시 사주 재계산 오류 (무시):', e);
      }
    }

    // JWT 토큰 생성
    const token = generateToken({
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: '로그인되었습니다.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          birthInfo: user.birthInfo,
          sajuAnalysis
        }
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
};

// 내 정보 조회
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        birthInfo: true,
        sajuAnalysis: true,
        mbti: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    // 기존 사용자의 sajuAnalysis에 sal 필드가 없으면 재계산 후 DB 업데이트
    let userData = user;
    const existingSaju = user.sajuAnalysis as any;
    if (user.birthInfo && existingSaju && !existingSaju.sal) {
      try {
        const freshAnalysis = sajuService.analyzeSaju(user.birthInfo as any);
        await prisma.user.update({
          where: { id: user.id },
          data: { sajuAnalysis: freshAnalysis as any }
        });
        userData = { ...user, sajuAnalysis: freshAnalysis as any };
      } catch (e) {
        console.error('사주 재계산 오류 (무시하고 기존 데이터 사용):', e);
      }
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
};

// MBTI 업데이트
export const updateMbti = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }

    const { mbti }: { mbti: string | null } = req.body;

    // MBTI 유효성 검사 (null이면 삭제, 아니면 유효한 MBTI인지 확인)
    const validMbtis = [
      'INTJ', 'INTP', 'ENTJ', 'ENTP',
      'INFJ', 'INFP', 'ENFJ', 'ENFP',
      'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
      'ISTP', 'ISFP', 'ESTP', 'ESFP'
    ];

    if (mbti !== null && !validMbtis.includes(mbti.toUpperCase())) {
      res.status(400).json({ error: '유효하지 않은 MBTI 유형입니다.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.userId },
      data: { mbti: mbti ? mbti.toUpperCase() : null },
      select: {
        id: true,
        email: true,
        name: true,
        birthInfo: true,
        sajuAnalysis: true,
        mbti: true,
        createdAt: true,
        lastLoginAt: true
      }
    });

    res.json({
      success: true,
      message: mbti ? 'MBTI가 설정되었습니다.' : 'MBTI가 삭제되었습니다.',
      data: updatedUser
    });
  } catch (error) {
    console.error('MBTI 업데이트 오류:', error);
    res.status(500).json({ error: 'MBTI 업데이트 중 오류가 발생했습니다.' });
  }
};
