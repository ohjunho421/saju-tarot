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
    const { email, password, name, birthInfo }: {
      email: string;
      password: string;
      name: string;
      birthInfo: BirthInfo;
    } = req.body;

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
        sajuAnalysis: sajuAnalysis as any
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
          sajuAnalysis: user.sajuAnalysis
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
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
  }
};
