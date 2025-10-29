import type { SajuAnalysis } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SajuResultProps {
  analysis: SajuAnalysis;
}

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

  const total = Object.values(elementBalance).reduce((sum, val) => sum + val, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 사주 차트 */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center">사주 만세력</h2>
        
        <div className="grid grid-cols-4 gap-4">
          {/* 년주 → 월주 → 일주 → 시주 순서로 표시 */}
          {[
            { key: 'year', label: '년주', data: chart.year },
            { key: 'month', label: '월주', data: chart.month },
            { key: 'day', label: '일주', data: chart.day },
            ...(chart.hour ? [{ key: 'hour', label: '시주', data: chart.hour }] : [])
          ].map(({ key, label, data }) => (
            <div key={key} className="text-center bg-white/5 rounded-lg p-4">
              <p className="text-sm text-white/60 mb-2">
                {label}
              </p>
              <div className="text-3xl font-bold mb-1">
                {data.heavenlyStem}
              </div>
              <div className="text-2xl mb-2">
                {data.earthlyBranch}
              </div>
              <div className={`text-sm ${elementColors[data.element]}`}>
                {data.element}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-lg">
            <span className="text-white/70">일간(Day Master):</span>{' '}
            <span className="text-2xl font-bold text-mystical-gold">{dayMaster}</span>{' '}
            <span className={`text-xl ${elementColors[dayMasterElement]}`}>({dayMasterElement})</span>
          </p>
        </div>
      </div>

      {/* 오행 균형 */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4">오행 균형</h3>
        
        <div className="space-y-3">
          {Object.entries(elementBalance).map(([element, value]) => {
            const percentage = (value / total) * 100;
            return (
              <div key={element}>
                <div className="flex justify-between mb-1">
                  <span className={elementColors[element]}>{element} (木火土金水)</span>
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
              <h4 className="font-semibold">강한 오행</h4>
            </div>
            <div className="flex gap-2">
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
              <h4 className="font-semibold">약한 오행</h4>
            </div>
            <div className="flex gap-2">
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
        <h3 className="text-xl font-bold mb-4">성격 분석</h3>
        <p className="text-lg leading-relaxed mb-6">{personality}</p>

        <div className="grid md:grid-cols-2 gap-6">
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
    </div>
  );
}
