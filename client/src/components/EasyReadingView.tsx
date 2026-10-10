import { useState } from 'react';
import type { DrawnCard, EasyReading, EasySignal, EasyTone, SpreadType } from '../types';
import { ChevronRight, CircleCheck, CirclePause, TriangleAlert, Lightbulb, Plus } from 'lucide-react';

interface EasyReadingViewProps {
  drawnCards: DrawnCard[];
  easyReading?: EasyReading;
  spreadType: SpreadType;
}

interface EasyStep {
  label: string;
  text: string;
}

interface EasyCardView {
  drawn: DrawnCard;
  tone: EasyTone;
  steps: EasyStep[];
}

const ADVICE_POSITION = '조언 카드';

// 순서가 있는 스프레드만 화살표로 잇는다. 선택지 비교는 vs, 나머지는 나란히
const CONNECTOR_BY_SPREAD: Partial<Record<SpreadType, 'arrow' | 'vs'>> = {
  'three-card': 'arrow',
  'six-months': 'arrow',
  'problem-solution': 'arrow',
  'two-card': 'vs',
};

const SIGNAL_META: Record<EasySignal, { label: string; className: string; Icon: typeof CircleCheck }> = {
  go: { label: '가도 좋아요', className: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/40', Icon: CircleCheck },
  wait: { label: '잠깐 기다려요', className: 'text-amber-200 bg-amber-300/10 border-amber-300/40', Icon: CirclePause },
  caution: { label: '조심해서 가요', className: 'text-rose-300 bg-rose-400/10 border-rose-400/40', Icon: TriangleAlert },
};

const TONE_META: Record<EasyTone, { label: string; dot: string }> = {
  good: { label: '좋은 흐름', dot: 'bg-emerald-400' },
  neutral: { label: '보통', dot: 'bg-white/50' },
  caution: { label: '주의', dot: 'bg-rose-400' },
};

// AI 요약이 있으면 그대로, 없으면(옛 기록·복구) 카드 기본 데이터로 간이 버전 생성
function buildCardViews(drawnCards: DrawnCard[], easyReading?: EasyReading): EasyCardView[] {
  return drawnCards.flatMap((drawn, i) => {
    // localStorage 기록 등 형태가 깨진 항목은 건너뜀
    if (!drawn?.card) return [];
    const easy = easyReading?.cards?.[i];
    if (easy && (easy.oneLine || easy.forMe)) {
      return {
        drawn,
        tone: Object.hasOwn(TONE_META, easy.tone) ? easy.tone : 'neutral',
        steps: [
          { label: '이 카드는', text: easy.oneLine },
          { label: '나에게는', text: easy.forMe },
          { label: '오늘 해볼 것', text: easy.action },
        ].filter(step => step.text),
      };
    }
    const meaning = drawn.isReversed ? drawn.card.reversedMeaning : drawn.card.uprightMeaning;
    return {
      drawn,
      tone: drawn.isReversed ? 'caution' : 'neutral',
      steps: [
        { label: '그림이 말하는 것', text: drawn.card.description },
        { label: `${drawn.positionMeaning} 자리의 뜻`, text: meaning },
      ].filter(step => step.text),
    };
  });
}

function CardThumb({ drawn, className }: { drawn: DrawnCard; className: string }) {
  const [failed, setFailed] = useState(false);
  const alt = `${drawn.card.nameKo}${drawn.isReversed ? ' (역방향)' : ''}`;

  return (
    <div className={`${className} aspect-[2/3] shrink-0 overflow-hidden rounded-lg border border-mystical-gold/40 bg-primary-900/40`}>
      {drawn.card.imageUrl && !failed ? (
        <img
          src={drawn.card.imageUrl}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${drawn.isReversed ? 'rotate-180' : ''}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-1 text-center text-[11px] leading-tight text-mystical-gold">
          {drawn.card.nameKo}
        </div>
      )}
    </div>
  );
}

function ToneDot({ tone }: { tone: EasyTone }) {
  const meta = TONE_META[tone];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-white/60">
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export default function EasyReadingView({ drawnCards, easyReading, spreadType }: EasyReadingViewProps) {
  const views = buildCardViews(drawnCards, easyReading);
  const mainViews = views.filter(v => v.drawn.positionMeaning !== ADVICE_POSITION);
  const adviceView = views.find(v => v.drawn.positionMeaning === ADVICE_POSITION);
  const connector = CONNECTOR_BY_SPREAD[spreadType];
  const signal = easyReading?.headline
    ? SIGNAL_META[Object.hasOwn(SIGNAL_META, easyReading.signal) ? easyReading.signal : 'wait']
    : null;

  return (
    <section className="card border-2 border-mystical-gold/40 bg-primary-900/20" aria-labelledby="easy-reading-title">
      <h2 id="easy-reading-title" className="mb-4 flex items-center gap-2 text-xl font-bold md:text-2xl">
        <Lightbulb className="h-5 w-5 text-mystical-gold md:h-6 md:w-6" aria-hidden="true" />
        쉽게 보기
      </h2>

      {/* 한 줄 결론 + 신호 */}
      {signal && easyReading && (
        <div className="mb-6">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${signal.className}`}>
            <signal.Icon className="h-4 w-4" aria-hidden="true" />
            {signal.label}
          </span>
          <p className="mt-3 break-keep font-serif text-2xl font-semibold leading-snug text-white md:text-3xl">
            {easyReading.headline}
          </p>
        </div>
      )}

      {/* 카드 흐름 도식 */}
      <div className="mb-6 rounded-xl bg-black/20 p-4">
        <p className="mb-3 text-sm text-white/60">카드 흐름 한눈에 보기</p>
        <ol className="flex flex-wrap items-start justify-center gap-x-1 gap-y-4">
          {mainViews.map((view, i) => (
            <li key={view.drawn.position} className="flex items-start">
              {i > 0 && connector === 'arrow' && (
                <ChevronRight className="mx-0.5 mt-9 h-4 w-4 shrink-0 text-mystical-gold/70 md:mt-11" aria-hidden="true" />
              )}
              {i > 0 && connector === 'vs' && (
                <span className="mx-2 mt-9 text-sm font-bold text-mystical-gold/80 md:mt-11">VS</span>
              )}
              <div className="flex w-16 flex-col items-center gap-1 text-center md:w-20">
                <CardThumb drawn={view.drawn} className="w-14 md:w-16" />
                <span className="w-full truncate text-xs font-semibold text-white/90" title={view.drawn.positionMeaning}>
                  {view.drawn.positionMeaning}
                </span>
                <ToneDot tone={view.tone} />
              </div>
            </li>
          ))}
          {adviceView && (
            <li className="flex items-start">
              <Plus className="mx-1 mt-9 h-4 w-4 shrink-0 text-mystical-gold/70 md:mt-11" aria-hidden="true" />
              <div className="flex w-16 flex-col items-center gap-1 text-center md:w-20">
                <CardThumb drawn={adviceView.drawn} className="w-14 md:w-16" />
                <span className="text-xs font-semibold text-mystical-gold">조언</span>
                <ToneDot tone={adviceView.tone} />
              </div>
            </li>
          )}
        </ol>
      </div>

      {/* 카드별 3단계 풀이 */}
      <ul className="divide-y divide-white/10">
        {views.map(view => (
          <li key={view.drawn.position} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
            <CardThumb drawn={view.drawn} className="w-20 md:w-24" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-white/60">{view.drawn.positionMeaning}</p>
              <p className="font-serif text-lg font-semibold text-mystical-gold">
                {view.drawn.card.nameKo}
                {view.drawn.isReversed && <span className="ml-2 align-middle text-xs font-sans font-normal text-rose-300">역방향</span>}
              </p>
              <ol className="mt-2 space-y-2 border-l border-mystical-gold/30 pl-4">
                {view.steps.map((step, i) => (
                  <li key={step.label} className="relative">
                    <span
                      className="absolute -left-[25px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-mystical-gold text-[10px] font-bold text-mystical-dark"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <p className="text-xs font-semibold text-white/60">{step.label}</p>
                    <p className="break-keep text-[15px] leading-relaxed text-white/90 md:text-base">{step.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </li>
        ))}
      </ul>

      {!easyReading && (
        <p className="mt-4 text-xs text-white/60">
          이 기록에는 AI 요약이 없어 카드 기본 의미로 보여드려요.
        </p>
      )}
    </section>
  );
}
