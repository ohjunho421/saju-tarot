import type { Element, SajuAnalysis } from '../types';
import { Lightbulb } from 'lucide-react';
import { ELEMENT_PLAIN } from '../data/elementPlain';

interface EasySajuViewProps {
  analysis: SajuAnalysis;
}

function ElementChip({ element }: { element: Element }) {
  const plain = ELEMENT_PLAIN[element];
  return (
    <span className={`shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-semibold ${plain.textClass}`}>
      {plain.name}({plain.hanja})
    </span>
  );
}

// 저장된 사주 데이터만으로 계산하는 쉬운 요약 (AI 호출 없음)
export default function EasySajuView({ analysis }: EasySajuViewProps) {
  const { dayMaster, dayMasterElement, strongElements, weakElements, sal } = analysis;
  const me = ELEMENT_PLAIN[dayMasterElement];
  const strong = strongElements.filter(el => ELEMENT_PLAIN[el]);
  const weak = weakElements.filter(el => ELEMENT_PLAIN[el]);
  // 같은 신살이 여러 위치에서 나올 수 있어 요약은 이름 기준으로 한 번씩만
  const goodSals = [...new Set((sal ?? []).filter(s => s.isPositive).map(s => s.name))];
  const cautionSals = [...new Set((sal ?? []).filter(s => !s.isPositive).map(s => s.name))];

  return (
    <section className="card border-2 border-mystical-gold/40 bg-primary-900/20" aria-labelledby="easy-saju-title">
      <h2 id="easy-saju-title" className="mb-4 flex items-center gap-2 text-xl font-bold md:text-2xl">
        <Lightbulb className="h-5 w-5 text-mystical-gold md:h-6 md:w-6" aria-hidden="true" />
        한눈에 보는 나
      </h2>

      {me && (
        <div className="mb-6">
          <p className="text-sm text-white/60">나를 상징하는 기운</p>
          <p className="mt-1 font-serif text-2xl font-semibold text-white md:text-3xl">
            <span className={me.textClass}>{me.name}</span> 같은 사람
          </p>
          <p className="mt-2 break-keep text-base leading-relaxed text-white/90">{me.person}</p>
          <p className="mt-1 text-xs text-white/60">
            태어난 날의 글자 '{dayMaster}'가 {me.name}({me.hanja}) 기운이라서 이렇게 봐요.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-emerald-400/10 p-4">
          <p className="mb-3 text-sm font-semibold text-emerald-300">많은 기운 · 내 무기</p>
          {strong.length > 0 ? (
            <ul className="space-y-2">
              {strong.map(el => (
                <li key={el} className="flex items-start gap-2">
                  <ElementChip element={el} />
                  <span className="break-keep text-[15px] leading-relaxed text-white/90">{ELEMENT_PLAIN[el].strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/70">특별히 넘치는 기운 없이 고르게 있어요.</p>
          )}
        </div>

        <div className="rounded-xl bg-amber-300/10 p-4">
          <p className="mb-3 text-sm font-semibold text-amber-200">부족한 기운 · 채우면 좋은 것</p>
          {weak.length > 0 ? (
            <ul className="space-y-3">
              {weak.map(el => (
                <li key={el} className="flex items-start gap-2">
                  <ElementChip element={el} />
                  <span className="break-keep text-[15px] leading-relaxed text-white/90">{ELEMENT_PLAIN[el].fillTip}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/70">크게 모자란 기운이 없어요.</p>
          )}
        </div>
      </div>

      {(goodSals.length > 0 || cautionSals.length > 0) && (
        <div className="mt-4 rounded-xl bg-black/20 p-4">
          <p className="mb-2 text-sm text-white/80">
            타고난 특징 표시(신살): 도움 되는 기운 {goodSals.length}개, 조심할 기운 {cautionSals.length}개
          </p>
          <div className="flex flex-wrap gap-1.5">
            {goodSals.map(name => (
              <span key={name} className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs text-green-300">{name}</span>
            ))}
            {cautionSals.map(name => (
              <span key={name} className="rounded-full bg-orange-500/15 px-2.5 py-1 text-xs text-orange-300">{name}</span>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/60">하나하나의 뜻은 아래 신살 분석에서 쉬운 말로 볼 수 있어요.</p>
        </div>
      )}
    </section>
  );
}
