import type { IntegratedReading } from '../types';
import { RotateCcw } from 'lucide-react';
import ChatBot from './ChatBot';

interface IntegratedResultProps {
  reading: IntegratedReading;
  onReset: () => void;
}

export default function IntegratedResult({ reading, onReset }: IntegratedResultProps) {
  const { drawnCards, interpretation, elementalHarmony, personalizedAdvice, adviceCardInterpretation } = reading;
  
  // 조언 카드와 일반 카드 분리
  const adviceCard = drawnCards.find(dc => dc.positionMeaning === '조언 카드');
  const mainCards = drawnCards.filter(dc => dc.positionMeaning !== '조언 카드');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">통합 해석 결과</h1>
        <p className="text-white/70">사주 만세력과 타로의 조화</p>
      </div>

      {/* 뽑힌 타로 카드 */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">타로 카드</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {mainCards.map(({ card, position, isReversed, positionMeaning }) => (
            <div key={position} className="text-center">
              <div className={`bg-white/5 rounded-lg p-4 mb-2 border-2 border-white/20 overflow-hidden ${isReversed ? 'rotate-180' : ''}`}>
                {card.imageUrl ? (
                  <img 
                    src={card.imageUrl} 
                    alt={card.nameKo}
                    className="w-full h-auto rounded-lg mb-2"
                    onError={(e) => {
                      // 이미지 로드 실패 시 대체 이모지 표시
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={card.imageUrl ? 'hidden' : 'text-4xl mb-2'}>🎴</div>
                <p className="text-sm font-semibold">{card.nameKo}</p>
              </div>
              <p className="text-xs text-white/60">{positionMeaning}</p>
              {isReversed && (
                <p className="text-xs text-red-400 mt-1">역방향</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 조언 카드 (별도 표시) */}
      {adviceCard && (
        <div className="card bg-gradient-to-br from-mystical-gold/20 to-primary-600/20 border-2 border-mystical-gold/50">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-mystical-gold">✨</span>
            조언 카드
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={`text-center ${adviceCard.isReversed ? 'rotate-180' : ''}`}>
              <div className="bg-mystical-gold/30 rounded-lg p-6 border-2 border-mystical-gold overflow-hidden">
                {adviceCard.card.imageUrl ? (
                  <img 
                    src={adviceCard.card.imageUrl} 
                    alt={adviceCard.card.nameKo}
                    className="w-full max-w-[200px] h-auto rounded-lg mb-3 mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={adviceCard.card.imageUrl ? 'hidden' : 'text-6xl mb-3'}>🎴</div>
                <p className="text-lg font-bold text-mystical-gold">{adviceCard.card.nameKo}</p>
                <p className="text-sm text-white/80">{adviceCard.card.name}</p>
              </div>
              {adviceCard.isReversed && (
                <p className="text-sm text-red-400 mt-2">역방향</p>
              )}
            </div>
            <div className="flex-1">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-white/90 leading-relaxed">
                  {adviceCard.isReversed ? adviceCard.card.reversedMeaning : adviceCard.card.uprightMeaning}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(adviceCard.isReversed ? adviceCard.card.reversedKeywords : adviceCard.card.uprightKeywords).map((keyword, i) => (
                    <span key={i} className="px-3 py-1 bg-mystical-gold/30 text-mystical-gold rounded-full text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI가 생성한 각 카드 상세 해석 (그림 설명 + 사주 연결 포함) */}
      <div className="card bg-gradient-to-br from-primary-600/10 to-purple-600/10 border-2 border-primary-500/30">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>🔮</span>
          <span>카드가 말해주는 이야기</span>
        </h2>
        <div className="text-white/90 leading-loose text-lg whitespace-pre-wrap break-keep" style={{ wordBreak: 'keep-all' }}>
          {interpretation}
        </div>
      </div>

      {/* 오행의 흐름 */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>🌊</span>
          <span>오행의 흐름</span>
        </h2>
        <div className="text-white/90 leading-loose text-lg whitespace-pre-wrap break-keep" style={{ wordBreak: 'keep-all' }}>
          {elementalHarmony}
        </div>
      </div>

      {/* 실천할 수 있는 조언 */}
      <div className="card bg-gradient-to-br from-primary-600/20 to-mystical-gold/20">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>💡</span>
          <span>실천할 수 있는 조언</span>
        </h2>
        <div className="text-white/90 leading-loose text-lg whitespace-pre-wrap break-keep" style={{ wordBreak: 'keep-all' }}>
          {personalizedAdvice}
        </div>
      </div>

      {/* 조언 카드의 메시지 */}
      {adviceCardInterpretation && (
        <div className="card bg-gradient-to-br from-mystical-gold/30 to-primary-600/30 border-2 border-mystical-gold">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-mystical-gold">✨</span>
            조언 카드의 메시지
          </h2>
          <div className="text-white/90 leading-loose text-lg whitespace-pre-wrap break-keep" style={{ wordBreak: 'keep-all' }}>
            {adviceCardInterpretation}
          </div>
        </div>
      )}

      {/* 챗봇 */}
      <ChatBot reading={reading} />

      {/* 액션 버튼 */}
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          onClick={onReset}
          className="btn-primary flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          새로운 리딩 시작
        </button>
      </div>

      {/* 면책 조항 */}
      <div className="text-center text-white/50 text-sm mt-8 p-4 border-t border-white/20">
        <p>⚠️ 본 해석은 엔터테인먼트 목적으로 제공되며, 의료·법률·재정 조언이 아닙니다.</p>
        <p className="mt-1">운세는 참고용이며 최종 결정은 본인의 판단에 따라 이루어져야 합니다.</p>
      </div>
    </div>
  );
}
