// 리딩을 상담사 목소리로 들려주기: AI가 말로 들려줄 1분 내외 대본을 쓰고, Fish로 음성(mp3)을 만든다
import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import aiService from '../services/ai.service';
import { isFishConfigured, synthesizeSpeech } from '../services/fish-tts.service';
import { createUserRateLimiter } from '../utils/user-rate-limit';
import { cleanSpreadText } from '../utils/custom-spread';

// 새로 만드는 경우: 사용자별 10분 10회. 저장된 음성 다시 듣기: 10분 60회(응답이 1MB 안팎이라 느슨하게)
const allowNewVoice = createUserRateLimiter(10, 10 * 60 * 1000);
const allowReplay = createUserRateLimiter(60, 10 * 60 * 1000);

// 계정을 여러 개 만들어 사용자별 제한을 넘는 경우를 막는 전체 상한 (하루, 서버 메모리 기준)
const DAILY_LIMIT = Number(process.env.VOICE_DAILY_LIMIT) || 300;
let dailyCount = { day: '', count: 0 };
const takeDailySlot = (): boolean => {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCount.day !== today) dailyCount = { day: today, count: 0 };
  if (dailyCount.count >= DAILY_LIMIT) return false;
  dailyCount = { ...dailyCount, count: dailyCount.count + 1 };
  return true;
};

// Fish 동시 요청 상한 (무료 모델 동시성 한도를 한 사람이 다 쓰지 않게)
const MAX_CONCURRENT = 3;
let activeGenerations = 0;

// 최근 음성만 서버 메모리에 둔다(재시작하면 비워짐). 전체 크기로 내보낸다
const CACHE_MAX_BYTES = 40 * 1024 * 1024;
const voiceCache = new Map<string, Buffer>();
let cacheBytes = 0;
// 같은 리딩을 동시에 여러 번 누르면 한 번만 만든다
const inFlight = new Map<string, Promise<Buffer>>();

// 대본(AI) + 음성(Fish) 전체 마감
const PIPELINE_TIMEOUT_MS = 120_000;

const READING_ID_PATTERN = /^[a-z0-9]{10,40}$/i;
const SUMMARY_MAX = 900;
const ADVICE_MAX = 500;

const remember = (id: string, audio: Buffer): void => {
  const previous = voiceCache.get(id);
  if (previous) {
    cacheBytes -= previous.length;
    voiceCache.delete(id);
  }
  voiceCache.set(id, audio);
  cacheBytes += audio.length;
  while (cacheBytes > CACHE_MAX_BYTES && voiceCache.size > 0) {
    const oldest = voiceCache.keys().next().value;
    if (oldest === undefined) break;
    cacheBytes -= voiceCache.get(oldest)?.length ?? 0;
    voiceCache.delete(oldest);
  }
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('음성 생성 시간 초과')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

// 저장된 drawnCards(JSON)에서 자리·카드 이름·방향만 꺼낸다
const toVoiceCards = (drawnCards: unknown): Array<{ position: string; name: string; reversed: boolean }> => {
  if (!Array.isArray(drawnCards)) return [];
  return drawnCards.flatMap((item) => {
    if (!isRecord(item) || !isRecord(item.card) || typeof item.card.nameKo !== 'string') return [];
    return [{
      position: typeof item.positionMeaning === 'string' ? cleanSpreadText(item.positionMeaning, 20) : '',
      name: cleanSpreadText(item.card.nameKo, 20),
      reversed: item.isReversed === true,
    }];
  });
};

const sendAudio = (res: Response, audio: Buffer): void => {
  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': String(audio.length),
    'Cache-Control': 'private, no-store', // 고민 내용이 담긴 음성이라 중간 캐시에 남기지 않는다
  });
  res.send(audio);
};

export const getVoiceStatus = (req: Request, res: Response): void => {
  res.json({ success: true, data: { available: isFishConfigured() } });
};

export const createReadingVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: '인증이 필요합니다.' });
      return;
    }
    const userId = req.user.userId;
    if (!isFishConfigured()) {
      res.status(503).json({ error: '지금은 목소리로 듣기를 쓸 수 없어요.' });
      return;
    }
    const { id } = req.params;
    if (!READING_ID_PATTERN.test(id)) {
      res.status(404).json({ error: '리딩을 찾을 수 없습니다.' });
      return;
    }

    // 본인 리딩만 (캐시·진행 중 요청보다 먼저 확인)
    const reading = await prisma.reading.findFirst({
      where: { id, userId },
      select: { id: true, question: true, drawnCards: true, interpretation: true, personalizedAdvice: true, easyReading: true },
    });
    if (!reading) {
      res.status(404).json({ error: '리딩을 찾을 수 없습니다.' });
      return;
    }

    const cached = voiceCache.get(reading.id);
    if (cached) {
      if (!allowReplay(userId)) {
        res.status(429).json({ error: '잠시 후 다시 들어 주세요.' });
        return;
      }
      sendAudio(res, cached);
      return;
    }

    // 확인부터 등록까지 await 없이 처리해 같은 리딩을 두 번 만들지 않게 한다
    let pending = inFlight.get(reading.id);
    if (!pending) {
      if (!allowNewVoice(userId)) {
        res.status(429).json({ error: '목소리 듣기는 10분에 10번까지예요. 잠시 후 다시 눌러 주세요.' });
        return;
      }
      if (activeGenerations >= MAX_CONCURRENT) {
        res.status(503).json({ error: '지금 듣는 분이 많아요. 잠시 후 다시 눌러 주세요.' });
        return;
      }
      if (!takeDailySlot()) {
        res.status(503).json({ error: '오늘 준비한 목소리 듣기가 모두 끝났어요. 내일 다시 들어 주세요.' });
        return;
      }

      const headline = isRecord(reading.easyReading) && typeof reading.easyReading.headline === 'string'
        ? cleanSpreadText(reading.easyReading.headline, 80)
        : undefined;
      activeGenerations += 1;
      const created: Promise<Buffer> = withTimeout((async () => {
        const script = await aiService.generateVoiceScript({
          question: cleanSpreadText(reading.question, 200),
          cards: toVoiceCards(reading.drawnCards),
          headline,
          summary: reading.interpretation.split('===CARD_DETAILS===')[0].trim().slice(0, SUMMARY_MAX),
          advice: reading.personalizedAdvice.slice(0, ADVICE_MAX),
        });
        const audio = await synthesizeSpeech(script);
        remember(reading.id, audio);
        return audio;
      })(), PIPELINE_TIMEOUT_MS);
      pending = created;
      inFlight.set(reading.id, created);
      created
        .finally(() => {
          activeGenerations -= 1;
          if (inFlight.get(reading.id) === created) inFlight.delete(reading.id);
        })
        .catch(() => undefined);
    }

    sendAudio(res, await pending);
  } catch (error) {
    // 대본·음성에는 고민 내용이 들어 있어 오류 메시지만 남긴다
    console.error('리딩 음성 생성 오류:', error instanceof Error ? error.message : 'unknown');
    if (!res.headersSent) {
      res.status(500).json({ error: '목소리를 만들지 못했어요. 잠시 후 다시 시도해 주세요.' });
    }
  }
};
