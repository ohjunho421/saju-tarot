import type { SajuAnalysis } from '../types';
import { TrendingUp, TrendingDown, Shield, Star } from 'lucide-react';
import ElementGuide from './ElementGuide';
import EasySajuView from './EasySajuView';
import { SAL_DETAILS } from '../data/salDetails';
import { ELEMENT_PLAIN } from '../data/elementPlain';

interface SajuResultProps {
  analysis: SajuAnalysis;
}

// 사주 표 각 기둥이 뜻하는 것 (용어 아래에 붙이는 쉬운 설명)
const PILLAR_CAPTIONS: Record<string, string> = {
  year: '태어난 해',
  month: '태어난 달',
  day: '태어난 날 · 나',
  hour: '태어난 시간'
};

export default function SajuResult({ analysis }: SajuResultProps) {
  const { chart, dayMaster, dayMasterElement, elementBalance, personality, strengths, weaknesses, strongElements, weakElements } = analysis;

  // 오행 색상
  const elementColors: Record<string, string> = {
    '목': 'text-green-400',
    '화': 'text-red-400',
    '토': 'text-yellow-400',
    '금': 'text-gray-300',
    '수': 'text-blue-400'
  };

  const elementLabel = (element: string) => {
    const plain = ELEMENT_PLAIN[element as keyof typeof ELEMENT_PLAIN];
    return plain ? `${element}(${plain.hanja}) ${plain.name}` : element;
  };

  const total = Object.values(elementBalance).reduce((sum, val) => sum + val, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 px-4">
      {/* 쉽게 보기: 나를 상징하는 기운 + 많은/부족한 기운 + 신살 요약 */}
      <EasySajuView analysis={analysis} />

      {/* 사주 차트 */}
      <div className="card">
        <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">사주 만세력</h2>
        <p className="mb-4 md:mb-6 text-center text-sm text-white/60 break-keep">
          태어난 해·달·날·시간을 글자 두 개씩으로 적은 표예요. 위는 하늘의 글자(천간), 아래는 땅의 글자(지지)예요.
        </p>

        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {/* 년주 → 월주 → 일주 → 시주 순서로 표시 */}
          {[
            { key: 'year', label: '년주', data: chart.year },
            { key: 'month', label: '월주', data: chart.month },
            { key: 'day', label: '일주', data: chart.day },
            ...(chart.hour ? [{ key: 'hour', label: '시주', data: chart.hour }] : [])
          ].map(({ key, label, data }) => (
            <div key={key} className={`text-center rounded-lg p-2 md:p-4 ${key === 'day' ? 'bg-mystical-gold/10 ring-1 ring-mystical-gold/40' : 'bg-white/5'}`}>
              <p className="text-xs md:text-sm text-white/80">
                {label}
              </p>
              <p className="text-[10px] md:text-xs text-white/60 mb-1 md:mb-2">{PILLAR_CAPTIONS[key]}</p>
              <div className="text-2xl md:text-3xl font-bold mb-1">
                {data.heavenlyStem}
              </div>
              <div className="text-xl md:text-2xl mb-1 md:mb-2">
                {data.earthlyBranch}
              </div>
              <div className={`text-xs md:text-sm ${elementColors[data.element]}`}>
                {data.element}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 md:mt-6 text-center">
          <p className="text-base md:text-lg">
            <span className="text-white/70">일간 · 나를 상징하는 글자:</span>{' '}
            <span className="text-xl md:text-2xl font-bold text-mystical-gold">{dayMaster}</span>{' '}
            <span className={`text-lg md:text-xl ${elementColors[dayMasterElement]}`}>({dayMasterElement})</span>
          </p>
        </div>
      </div>

      {/* 오행 균형 */}
      <div className="card">
        <h3 className="text-lg md:text-xl font-bold mb-1">오행 균형</h3>
        <p className="mb-3 md:mb-4 text-sm text-white/60">나무·불·흙·쇠·물 다섯 기운이 내 사주에 얼마나 있는지예요.</p>

        <div className="space-y-3">
          {Object.entries(elementBalance).map(([element, value]) => {
            const percentage = (value / total) * 100;
            return (
              <div key={element}>
                <div className="flex justify-between mb-1">
                  <span className={elementColors[element]}>{elementLabel(element)}</span>
                  <span>{value} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      element === '목' ? 'bg-green-500' :
                      element === '화' ? 'bg-red-500' :
                      element === '토' ? 'bg-yellow-500' :
                      element === '금' ? 'bg-gray-400' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h4 className="font-semibold">많은 기운 · 내 무기</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {strongElements.map(el => (
                <span key={el} className={`px-3 py-1 rounded-full bg-white/10 ${elementColors[el]}`}>
                  {el}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              <h4 className="font-semibold">부족한 기운 · 채우면 좋은 것</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {weakElements.map(el => (
                <span key={el} className={`px-3 py-1 rounded-full bg-white/10 ${elementColors[el]}`}>
                  {el}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 성격 분석 */}
      <div className="card">
        <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">성격 분석</h3>
        <p className="text-base md:text-lg leading-relaxed mb-4 md:mb-6">{personality}</p>

        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <h4 className="font-semibold mb-3 text-green-400">강점</h4>
            <ul className="space-y-2">
              {strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {weaknesses.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-yellow-400">주의할 점</h4>
              <ul className="space-y-2">
                {weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-1">⚠</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 별자리 분석 */}
      {analysis.zodiac && (
        <div className="card">
          <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-indigo-400" />
            별자리 분석
          </h3>
          <div className="bg-indigo-500/10 rounded-xl p-4 md:p-6 border border-indigo-500/20">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{analysis.zodiac.symbol}</span>
              <div>
                <h4 className="text-xl font-bold text-indigo-300">
                  {analysis.zodiac.sign}
                  <span className="text-sm text-white/50 ml-2 font-normal">
                    {analysis.zodiac.signEnglish}
                  </span>
                </h4>
                <p className="text-sm text-white/60">
                  {analysis.zodiac.dateRange} | {analysis.zodiac.element} 원소 | {analysis.zodiac.quality} | 수호성: {analysis.zodiac.rulingPlanet}
                </p>
              </div>
            </div>

            <p className="text-base leading-relaxed mb-4 text-white/80">
              {analysis.zodiac.personality}
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-semibold mb-2 text-indigo-300 text-sm">별자리 강점</h5>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.zodiac.strengths.map((s, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-indigo-500/15 text-indigo-300">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-2 text-amber-300 text-sm">주의할 성향</h5>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.zodiac.weaknesses.map((w, i) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-300">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {analysis.zodiac.compatibility && analysis.zodiac.compatibility.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h5 className="font-semibold mb-2 text-pink-300 text-sm">궁합 좋은 별자리</h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.zodiac.compatibility.map((c, i) => (
                    <span key={i} className="text-xs px-3 py-1 rounded-full bg-pink-500/15 text-pink-300">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/60">
                사주의 {dayMasterElement} 기운과 별자리의 {analysis.zodiac.element} 원소는 타로 리딩 때 함께 반영돼요.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 살(煞) 분석 */}
      {analysis.sal && analysis.sal.length > 0 && (
        <div className="card">
          <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            신살(神煞) 분석
          </h3>
          <p className="text-white/70 text-sm mb-4 break-keep">
            신살은 사주 글자 조합에서 보이는 타고난 특징 표시예요. 초록은 도움 되는 기운, 주황은 조심하면 되는 기운이에요. 정해진 운명이 아니라 "이런 경향이 있다" 정도로 보면 돼요.
          </p>
          <div className="space-y-4">
            {analysis.sal.map((sal, idx) => {
              const detail = SAL_DETAILS[sal.name];
              return (
                <div
                  key={idx}
                  className={`rounded-xl overflow-hidden border-2 ${
                    sal.isPositive
                      ? 'border-green-500/30'
                      : 'border-orange-500/30'
                  }`}
                >
                  {/* 헤더 */}
                  <div className={`px-4 py-3 ${
                    sal.isPositive
                      ? 'bg-green-500/20'
                      : 'bg-orange-500/20'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{detail?.emoji || (sal.isPositive ? '✨' : '⚠️')}</span>
                      <div>
                        <h4 className="font-bold text-base md:text-lg flex flex-wrap items-center gap-2">
                          {sal.name}
                          {detail && <span className="text-white/60 text-sm font-normal">({detail.hanja})</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sal.isPositive
                              ? 'bg-green-500/30 text-green-400'
                              : 'bg-orange-500/30 text-orange-400'
                          }`}>
                            {sal.isPositive ? '도움 (길신)' : '조심 (흉살)'}
                          </span>
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* 본문 */}
                  <div className={`p-4 space-y-3 ${
                    sal.isPositive ? 'bg-green-500/5' : 'bg-orange-500/5'
                  }`}>
                    {/* 쉽게 말하면 */}
                    {detail && (
                      <div>
                        <p className="text-xs text-white/60 mb-1 font-semibold">쉽게 말하면</p>
                        <p className="text-white/90 text-[15px] leading-relaxed break-keep">{detail.plain}</p>
                      </div>
                    )}

                    {/* 키워드 */}
                    {detail && (
                      <div className="flex flex-wrap gap-1.5">
                        {detail.keywords.map((kw, ki) => (
                          <span key={ki} className={`text-xs px-2 py-1 rounded-full ${
                            sal.isPositive
                              ? 'bg-green-500/15 text-green-300'
                              : 'bg-orange-500/15 text-orange-300'
                          }`}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 생활에서는 */}
                    {detail && (
                      <div>
                        <p className="text-xs text-white/60 mb-1 font-semibold">생활에서는</p>
                        <p className="text-white/80 text-sm leading-relaxed break-keep">{detail.realLife}</p>
                      </div>
                    )}

                    {/* 이렇게 해보세요 */}
                    {detail && (
                      <div className={`rounded-lg p-3 ${
                        sal.isPositive ? 'bg-green-500/10' : 'bg-orange-500/10'
                      }`}>
                        <p className="text-xs text-white/60 mb-1 font-semibold">💡 이렇게 해보세요</p>
                        <p className="text-white/90 text-sm leading-relaxed break-keep">{detail.advice}</p>
                      </div>
                    )}

                    {/* 발견 위치 */}
                    <p className="text-white/40 text-xs">{sal.location}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {analysis.sal.filter(s => !s.isPositive).length === 0 && (
            <p className="text-green-400 text-sm mt-3">
              ✨ 조심할 기운 없이 도움 되는 기운만 있어요.
            </p>
          )}
        </div>
      )}

      {/* 오행 가이드 */}
      <ElementGuide />
    </div>
  );
}
