import { useEffect, useState } from 'react';
import type { IntegratedReading } from '../types';
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import ChatBot from './ChatBot';

interface IntegratedResultProps {
  reading: IntegratedReading;
  onReset: () => void;
}

export default function IntegratedResult({ reading, onReset }: IntegratedResultProps) {
  const { drawnCards, interpretation, elementalHarmony, personalizedAdvice, adviceCardInterpretation, question, spreadType } = reading;
  
  // 아코디언 상태 관리
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    cards: false,
    interpretation: false,
    harmony: false,
    advice: false,
    adviceCard: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // localStorage에 히스토리 저장
  useEffect(() => {
    try {
      const historyItem = {
        id: reading.readingId || Date.now().toString(),
        question,
        spreadType,
        drawnCards,
        interpretation,
        elementalHarmony,
        personalizedAdvice,
        adviceCardInterpretation,
        createdAt: new Date().toISOString(),
      };
      
      // 기존 히스토리 가져오기
      const savedHistory = localStorage.getItem('tarot_history');
      const history = savedHistory ? JSON.parse(savedHistory) : [];
      
      // 새 항목을 맨 앞에 추가 (최신순)
      const updatedHistory = [historyItem, ...history].slice(0, 50); // 최대 50개까지만 저장
      
      localStorage.setItem('tarot_history', JSON.stringify(updatedHistory));
      console.log('✅ 히스토리 저장 완료:', historyItem);
    } catch (err) {
      console.error('❌ 히스토리 저장 실패:', err);
    }
  }, [reading]);
  
  // 조언 카드와 일반 카드 분리
  const adviceCard = drawnCards.find(dc => dc.positionMeaning === '조언 카드');
  const mainCards = drawnCards.filter(dc => dc.positionMeaning !== '조언 카드');

  // interpretation을 요약과 세부로 분리
  const getSummary = (text: string) => {
    const lines = text.split('\n\n');
    return lines[0] || text.substring(0, 200);
  };

  const getDetailedContent = (text: string) => {
    const lines = text.split('\n\n');
    return lines.slice(1).join('\n\n') || text.substring(200);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 md:space-y-6 px-4">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">통합 해석 결과</h1>
        <p className="text-sm md:text-base text-white/70">사주 만세력과 타로의 조화</p>
      </div>

      {/* 요약 섹션 */}
      <div className="card bg-gradient-to-br from-mystical-gold/20 to-primary-600/20 border-2 border-mystical-gold/50">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span>✨</span>
            <span>핵심 요약</span>
          </h2>
          {expandedSections.summary ? (
            <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-mystical-gold flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-mystical-gold flex-shrink-0" />
          )}
        </button>
        {expandedSections.summary && (
          <div className="text-white/90 leading-loose text-base md:text-lg whitespace-pre-wrap break-keep animate-slideDown">
            {getSummary(interpretation)}
          </div>
        )}
      </div>

      {/* 뽑힌 타로 카드 */}
      <div className="card">
        <button
          onClick={() => toggleSection('cards')}
          className="w-full flex items-center justify-between mb-4 md:mb-6"
        >
          <h2 className="text-xl md:text-2xl font-bold">타로 카드</h2>
          {expandedSections.cards ? (
            <ChevronUp className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          )}
        </button>
        {expandedSections.cards && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 animate-slideDown">
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
        )}
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
        <button
          onClick={() => toggleSection('interpretation')}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span>🔮</span>
            <span className="text-left">카드가 말해주는 이야기</span>
          </h2>
          {expandedSections.interpretation ? (
            <ChevronUp className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          )}
        </button>
        {expandedSections.interpretation && (
          <div className="text-white/90 leading-loose text-base md:text-lg whitespace-pre-wrap break-keep animate-slideDown" style={{ wordBreak: 'keep-all' }}>
            {getDetailedContent(interpretation)}
          </div>
        )}
      </div>

      {/* 오행의 흐름 */}
      <div className="card">
        <button
          onClick={() => toggleSection('harmony')}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span>🌊</span>
            <span>오행의 흐름</span>
          </h2>
          {expandedSections.harmony ? (
            <ChevronUp className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          )}
        </button>
        {expandedSections.harmony && (
          <div className="text-white/90 leading-loose text-base md:text-lg whitespace-pre-wrap break-keep animate-slideDown" style={{ wordBreak: 'keep-all' }}>
            {elementalHarmony}
          </div>
        )}
      </div>

      {/* 실천할 수 있는 조언 */}
      <div className="card bg-gradient-to-br from-primary-600/20 to-mystical-gold/20">
        <button
          onClick={() => toggleSection('advice')}
          className="w-full flex items-center justify-between mb-3 md:mb-4"
        >
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <span>💡</span>
            <span className="text-left">실천할 수 있는 조언</span>
          </h2>
          {expandedSections.advice ? (
            <ChevronUp className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
          )}
        </button>
        {expandedSections.advice && (
          <div className="text-white/90 leading-loose text-base md:text-lg whitespace-pre-wrap break-keep animate-slideDown" style={{ wordBreak: 'keep-all' }}>
            {personalizedAdvice}
          </div>
        )}
      </div>

      {/* 조언 카드의 메시지 */}
      {adviceCardInterpretation && (
        <div className="card bg-gradient-to-br from-mystical-gold/30 to-primary-600/30 border-2 border-mystical-gold">
          <button
            onClick={() => toggleSection('adviceCard')}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-mystical-gold">✨</span>
              조언 카드의 메시지
            </h2>
            {expandedSections.adviceCard ? (
              <ChevronUp className="w-6 h-6 text-mystical-gold" />
            ) : (
              <ChevronDown className="w-6 h-6 text-mystical-gold" />
            )}
          </button>
          {expandedSections.adviceCard && (
            <div className="text-white/90 leading-loose text-lg whitespace-pre-wrap break-keep animate-slideDown" style={{ wordBreak: 'keep-all' }}>
              {adviceCardInterpretation}
            </div>
          )}
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

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
