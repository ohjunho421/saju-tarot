import { useState, useRef, useEffect } from 'react';
import type { SpreadType, DrawnCard } from '../types';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [wheelRotation, setWheelRotation] = useState(0);
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCardCount, setVisibleCardCount] = useState(15); // 한 번에 보이는 카드 수

  // 카드 덱 생성 (78장)
  const totalDeckSize = 78;
  const deckCards = Array.from({ length: totalDeckSize }, (_, i) => i);

  // 모바일 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // 화면 크기에 따른 가시 카드 수 조정
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleCardCount(9);
      } else if (width < 1024) {
        setVisibleCardCount(13);
      } else {
        setVisibleCardCount(17);
      }
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  // 휠 회전 함수
  const rotateWheel = (direction: 'left' | 'right') => {
    const rotationAmount = 360 / totalDeckSize; // 카드 하나당 회전 각도
    const steps = isMobile ? 3 : 5; // 한 번에 회전할 카드 수
    setWheelRotation(prev => 
      direction === 'left' 
        ? prev + (rotationAmount * steps)
        : prev - (rotationAmount * steps)
    );
  };

  // 마우스 휠 이벤트 처리
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isRevealing) return;
      e.preventDefault();
      const direction = e.deltaY > 0 ? 'right' : 'left';
      rotateWheel(direction);
    };

    const container = wheelContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [isRevealing, isMobile]);

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

      {/* 카드 휠 - U자형 회전 스프레드 */}
      <div className="relative">
        {/* 회전 버튼 */}
        <button
          onClick={() => rotateWheel('left')}
          disabled={isRevealing}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-purple-800/90 p-3 md:p-4 rounded-full shadow-2xl hover:bg-purple-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="왼쪽 회전"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={() => rotateWheel('right')}
          disabled={isRevealing}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-purple-800/90 p-3 md:p-4 rounded-full shadow-2xl hover:bg-purple-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="오른쪽 회전"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        <div className="text-center text-sm text-white/60 mb-4">
          💡 마우스 휠이나 버튼으로 카드를 회전시켜 보세요
        </div>

        {/* 회전 휠 카드 배치 */}
        <div 
          ref={wheelContainerRef}
          className="relative mx-auto overflow-hidden"
          style={{ 
            height: isMobile ? '400px' : '500px',
            maxWidth: '100%'
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            {deckCards.map((cardIndex) => {
              const isSelected = selectedCards.includes(cardIndex);
              const isRevealed = revealedCards.has(cardIndex);
              const selectionOrder = selectedCards.indexOf(cardIndex);
              
              // 원형 배치를 위한 각도 계산 (회전 적용)
              const baseAngle = (cardIndex / totalDeckSize) * 360;
              const angle = baseAngle + wheelRotation;
              const angleRad = (angle * Math.PI) / 180;
              
              // 화면 크기에 따른 반지름
              const radius = isMobile ? 180 : 260;
              
              // 카드 위치 계산 (원형 배치)
              const x = Math.sin(angleRad) * radius;
              const y = -Math.cos(angleRad) * radius * 0.6; // 0.6을 곱해서 U자형으로
              
              // 중앙 근처의 카드만 표시 (가시성 최적화)
              const normalizedAngle = ((angle % 360) + 360) % 360;
              const isInVisibleRange = normalizedAngle < (180 * visibleCardCount / totalDeckSize) || 
                                      normalizedAngle > (360 - 180 * visibleCardCount / totalDeckSize);
              
              if (!isInVisibleRange && !isSelected) return null;
              
              // 카드 크기 (거리에 따라 조정)
              const distanceFromCenter = Math.abs(normalizedAngle - 180);
              const scale = 1 - (distanceFromCenter / 360) * 0.4;
              const opacity = isSelected ? 1 : 0.6 + scale * 0.4;
              
              return (
                <button
                  key={cardIndex}
                  onClick={() => handleCardClick(cardIndex)}
                  disabled={isRevealing || (isSelected && !isRevealed)}
                  className={`
                    absolute ${isMobile ? 'w-20' : 'w-28 md:w-32'} aspect-[2/3] rounded-lg transition-all duration-300
                    ${isSelected ? 'z-30 scale-110' : 'hover:scale-105 z-10'}
                    ${isRevealed ? 'animate-flip' : ''}
                    ${!isSelected && !isRevealing ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translate(${x}px, ${y}px) scale(${isSelected ? 1.1 : scale}) ${isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'}`,
                    opacity: opacity,
                    left: '50%',
                    top: '50%',
                    marginLeft: isMobile ? '-40px' : '-56px',
                    marginTop: isMobile ? '-60px' : '-84px'
                  }}
                >
                    {/* 카드 뒷면 */}
                    <div className={`
                      absolute inset-0 rounded-lg
                      bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900
                      border-2 ${isSelected ? 'border-mystical-gold shadow-[0_0_30px_rgba(218,165,32,0.6)]' : 'border-purple-400/50'}
                      flex items-center justify-center
                      backface-hidden
                    `}>
                      <div className="relative w-full h-full p-1.5 md:p-2">
                        <div className="w-full h-full border-2 border-mystical-gold/30 rounded flex items-center justify-center">
                          <div className="text-center">
                            <Sparkles className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} text-mystical-gold/50 mx-auto mb-1`} />
                            <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} border-2 border-mystical-gold/30 rounded-full mx-auto`} />
                          </div>
                        </div>
                      </div>
                      
                      {isSelected && !isRevealed && (
                        <div className="absolute top-1 right-1 w-5 h-5 md:w-6 md:h-6 bg-mystical-gold rounded-full flex items-center justify-center text-xs font-bold text-purple-900">
                          {selectionOrder + 1}
                        </div>
                      )}
                    </div>

                    {/* 카드 앞면 */}
                    {isRevealed && drawnCards && (
                      <div 
                        className="absolute inset-0 rounded-lg bg-white flex flex-col items-center justify-center p-1 backface-hidden overflow-hidden"
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        {(() => {
                          const cardData = drawnCards[selectionOrder];
                          if (!cardData) return <div className="text-3xl md:text-4xl">🎴</div>;
                          
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
                                <div className="text-3xl md:text-4xl mb-1">🎴</div>
                                <p className="text-xs font-bold text-purple-900 text-center px-1">{cardData.card.nameKo}</p>
                                {cardData.isReversed && (
                                  <p className="text-xs text-red-600">역방향</p>
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
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
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
