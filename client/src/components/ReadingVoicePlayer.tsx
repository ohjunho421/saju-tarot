import { useEffect, useRef, useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';
import { aiApi } from '../services/api';

interface ReadingVoicePlayerProps {
  readingId: string;
}

// 서버 리딩 id(cuid)만 음성으로 만들 수 있다. 예전 기록의 시각 숫자 id 등은 버튼을 숨긴다
const SERVER_READING_ID = /^c[a-z0-9]{20,39}$/i;

// 서버에 목소리 기능(Fish 키)이 켜져 있는지는 화면 전체에서 한 번만 묻는다.
// 켜져 있다는 답만 기억하고, 꺼짐·실패면 다음에 다시 묻는다
let voiceAvailable: Promise<boolean> | null = null;
const isVoiceAvailable = (): Promise<boolean> => {
  if (!voiceAvailable) {
    voiceAvailable = aiApi.getVoiceStatus().catch(() => false);
    voiceAvailable.then((ok) => {
      if (!ok) voiceAvailable = null;
    });
  }
  return voiceAvailable;
};

// 리딩을 상담사가 말로 들려주는 음성(1분 내외). 처음 누를 때 서버가 대본과 음성을 만든다
export default function ReadingVoicePlayer({ readingId }: ReadingVoicePlayerProps) {
  const [available, setAvailable] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  // 만드는 중에 화면을 떠나면 요청을 취소한다(늦게 온 음성이 메모리에 남지 않게)
  useEffect(() => () => requestRef.current?.abort(), []);

  useEffect(() => {
    if (!SERVER_READING_ID.test(readingId)) return;
    let active = true;
    isVoiceAvailable().then((ok) => {
      if (active) setAvailable(ok);
    });
    return () => {
      active = false;
    };
  }, [readingId]);

  // 다른 리딩으로 바뀌거나 화면을 떠나면 음성 주소를 정리한다
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // 음성이 준비되면 바로 재생해 본다. 기다리는 동안 브라우저가 자동 재생을 막으면 재생 버튼을 누르면 된다
  useEffect(() => {
    if (status === 'ready') audioRef.current?.play().catch(() => undefined);
  }, [status]);

  if (!available) return null;

  const handleLoad = async () => {
    setStatus('loading');
    setError('');
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const blob = await aiApi.getReadingVoice(readingId, controller.signal);
      if (controller.signal.aborted) return;
      setAudioUrl(URL.createObjectURL(blob));
      setStatus('ready');
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : '목소리를 만들지 못했어요. 잠시 후 다시 시도해 주세요.');
      setStatus('error');
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  if (status === 'ready' && audioUrl) {
    return (
      <div className="rounded-xl border border-mystical-gold/30 bg-white/5 px-4 py-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-mystical-gold">
          <Headphones className="h-4 w-4" aria-hidden="true" />
          상담사가 들려주는 리딩
        </p>
        <audio ref={audioRef} src={audioUrl} controls preload="auto" className="w-full" aria-label="상담사가 들려주는 리딩" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-mystical-gold/30 bg-white/5 px-4 py-3">
      <button
        type="button"
        onClick={handleLoad}
        disabled={status === 'loading'}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-mystical-gold/90 px-4 py-3 font-semibold text-mystical-dark transition-colors hover:bg-mystical-gold disabled:cursor-wait disabled:opacity-80"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            상담사가 이야기를 준비하고 있어요
          </>
        ) : (
          <>
            <Headphones className="h-5 w-5" aria-hidden="true" />
            {status === 'error' ? '다시 듣기 시도' : '상담사 목소리로 듣기'}
          </>
        )}
      </button>
      <p className="mt-2 text-center text-xs text-white/60 break-keep" role={status === 'error' ? 'alert' : undefined}>
        {status === 'error'
          ? error
          : status === 'loading'
            ? '처음 들을 때는 목소리를 만드느라 1분쯤 걸려요. 이 화면에서 기다려 주세요.'
            : '리딩을 1분 정도의 쉬운 이야기로 들려드려요.'}
      </p>
    </div>
  );
}
