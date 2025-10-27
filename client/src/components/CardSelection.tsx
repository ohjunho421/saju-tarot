import { useState } from 'react';
import type { SpreadType, DrawnCard } from '../types';
import { Sparkles } from 'lucide-react';

interface CardSelectionProps {
  spreadType: SpreadType;
  question?: string;
  drawnCards?: DrawnCard[];
  onComplete: (selectedPositions: number[]) => void;
}

const SPREAD_CARD_COUNTS: Record<SpreadType, number> = {
  'one-card': 1,
  'three-card': 3,
  'celtic-cross': 10,
  'saju-custom': 5
};

const GUIDANCE_MESSAGES: Record<SpreadType, string> = {
  'one-card': '마음을 가라앉히고, 질문에 집중하며 한 장의 카드를 선택하세요.',
  'three-card': '과거, 현재, 미래를 생각하며 세 장의 카드를 차례로 선택하세요.',
  'celtic-cross': '당신의 인생 전체를 아우르는 복잡한 상황을 떠올리며 열 장을 선택하세요.',
  'saju-custom': '당신의 사주와 오행을 생각하며 다섯 장의 카드를 선택하세요.'
};

export default function CardSelection({ spreadType, question, drawnCards, onComplete }: CardSelectionProps) {
  const totalCards = SPREAD_CARD_COUNTS[spreadType];
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());

  // 카드 덱 생성 (78장)
  const totalDeckSize = 78;
  const deckCards = Array.from({ length: totalDeckSize }, (_, i) => i);

  const handleCardClick = (index: number) => {
    if (isRevealing || selectedCards.includes(index)) return;
    
    if (selectedCards.length < totalCards) {
      const newSelected = [...selectedCards, index];
      setSelectedCards(newSelected);
      
      // 모든 카드 선택 완료
      if (newSelected.length === totalCards) {
        setTimeout(() => {
          revealCards(newSelected);
        }, 500);
      }
    }
  };

  const revealCards = (cards: number[]) => {
    setIsRevealing(true);
    
    // 카드를 하나씩 뒤집기
    cards.forEach((cardIndex, i) => {
      setTimeout(() => {
        setRevealedCards(prev => new Set([...prev, cardIndex]));
        
        // 마지막 카드 뒤집기 완료 후
        if (i === cards.length - 1) {
          setTimeout(() => {
            onComplete(cards);
          }, 1000);
        }
      }, i * 400);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* 안내 메시지 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-mystical-gold/20 border border-mystical-gold/50 rounded-full mb-4">
          <Sparkles className="w-5 h-5 text-mystical-gold" />
          <span className="text-mystical-gold font-semibold">
            {selectedCards.length}/{totalCards} 선택됨
          </span>
        </div>
        
        {question && (
          <h2 className="text-2xl font-bold mb-4 text-white">"{question}"</h2>
        )}
        
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          {GUIDANCE_MESSAGES[spreadType]}
        </p>
        
        {selectedCards.length > 0 && selectedCards.length < totalCards && (
          <p className="text-sm text-mystical-gold mt-4 animate-pulse">
            🌟 직관을 믿고 다음 카드를 선택하세요
          </p>
        )}
        
        {isRevealing && (
          <p className="text-sm text-mystical-gold mt-4 animate-pulse">
            ✨ 카드를 공개하고 있습니다...
          </p>
        )}
      </div>

      {/* 카드 덱 */}
      <div className="relative">
        {/* 배경 카드들 (선택되지 않은 카드) */}
        <div className="grid grid-cols-10 md:grid-cols-13 gap-2 mb-8 opacity-30">
          {deckCards.slice(0, 52).map((_, index) => (
            <div
              key={`bg-${index}`}
              className="aspect-[2/3] bg-gradient-to-br from-purple-900/50 to-indigo-900/50 rounded-lg border border-white/20"
            />
          ))}
        </div>

        {/* 선택 가능한 카드들 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl">
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${Math.min(totalDeckSize, 13)}, minmax(0, 1fr))`
            }}
          >
            {deckCards.map((cardIndex) => {
              const isSelected = selectedCards.includes(cardIndex);
              const isRevealed = revealedCards.has(cardIndex);
              const selectionOrder = selectedCards.indexOf(cardIndex);

              return (
                <button
                  key={cardIndex}
                  onClick={() => handleCardClick(cardIndex)}
                  disabled={isRevealing || (isSelected && !isRevealed)}
                  className={`
                    aspect-[2/3] rounded-lg transition-all duration-500 relative
                    ${isSelected ? 'scale-110 z-10' : 'hover:scale-105 hover:-translate-y-2'}
                    ${isRevealed ? 'animate-flip' : ''}
                    ${!isSelected && !isRevealing ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* 카드 뒷면 */}
                  <div className={`
                    absolute inset-0 rounded-lg
                    bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900
                    border-2 ${isSelected ? 'border-mystical-gold shadow-[0_0_30px_rgba(218,165,32,0.5)]' : 'border-purple-400/50'}
                    flex items-center justify-center
                    backface-hidden
                  `}>
                    {/* 카드 뒷면 무늬 */}
                    <div className="relative w-full h-full p-2">
                      <div className="w-full h-full border-2 border-mystical-gold/30 rounded flex items-center justify-center">
                        <div className="text-center">
                          <Sparkles className="w-8 h-8 text-mystical-gold/50 mx-auto mb-2" />
                          <div className="w-12 h-12 border-2 border-mystical-gold/30 rounded-full mx-auto" />
                        </div>
                      </div>
                    </div>
                    
                    {/* 선택 순서 표시 */}
                    {isSelected && !isRevealed && (
                      <div className="absolute top-2 right-2 w-8 h-8 bg-mystical-gold rounded-full flex items-center justify-center text-sm font-bold text-purple-900">
                        {selectionOrder + 1}
                      </div>
                    )}
                  </div>

                  {/* 카드 앞면 (실제 카드 이미지) */}
                  {isRevealed && drawnCards && (
                    <div 
                      className="absolute inset-0 rounded-lg bg-white flex flex-col items-center justify-center p-2 backface-hidden overflow-hidden"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {(() => {
                        const cardData = drawnCards[selectionOrder];
                        if (!cardData) return <div className="text-6xl">🎴</div>;
                        
                        return (
                          <>
                            {cardData.card.imageUrl ? (
                              <img 
                                src={cardData.card.imageUrl}
                                alt={cardData.card.nameKo}
                                className={`w-full h-full object-contain ${cardData.isReversed ? 'rotate-180' : ''}`}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={cardData.card.imageUrl ? 'hidden' : 'flex flex-col items-center justify-center h-full'}>
                              <div className="text-6xl mb-2">🎴</div>
                              <p className="text-sm font-bold text-purple-900 text-center">{cardData.card.nameKo}</p>
                              {cardData.isReversed && (
                                <p className="text-xs text-red-600 mt-1">역방향</p>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes flip {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        .animate-flip {
          animation: flip 0.6s ease-in-out forwards;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
