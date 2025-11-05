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
  const [fanRotation, setFanRotation] = useState(0);
  const fanContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleCardCount, setVisibleCardCount] = useState(21); // 한 번에 보이는 카드 수 (부채꼴용)

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
        setVisibleCardCount(15); // 모바일: 15장
      } else if (width < 1024) {
        setVisibleCardCount(21); // 태블릿: 21장
      } else {
        setVisibleCardCount(27); // 데스크톱: 27장
      }
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  // 부채꼴 회전 함수
  const rotateFan = (direction: 'left' | 'right') => {
    const steps = isMobile ? 2 : 3; // 한 번에 이동할 카드 수
    setFanRotation(prev => 
      direction === 'left' 
        ? prev - steps
        : prev + steps
    );
  };

  // 마우스 휠 이벤트 처리
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (isRevealing) return;
      e.preventDefault();
      const direction = e.deltaY > 0 ? 'right' : 'left';
      rotateFan(direction);
    };

    const container = fanContainerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [isRevealing, isMobile]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* 안내 메시지 */}
      <div className="text-center mb-6">
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

      {/* 선택된 카드 표시 영역 */}
      {selectedCards.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 p-4 bg-gradient-to-br from-mystical-gold/10 to-purple-600/10 rounded-xl border-2 border-mystical-gold/30">
            {selectedCards.map((cardIndex, idx) => {
              const isRevealed = revealedCards.has(cardIndex);
              return (
                <div
                  key={cardIndex}
                  className={`relative transition-all duration-500 ${
                    isRevealed ? 'animate-revealCard' : ''
                  }`}
                  style={{
                    animationDelay: `${idx * 400}ms`
                  }}
                >
                  <div 
                    className={`${isMobile ? 'w-20' : 'w-24 md:w-28'} aspect-[2/3] rounded-lg transition-all duration-500`}
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                  >
                    {/* 카드 뒷면 */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 border-2 border-mystical-gold shadow-[0_0_20px_rgba(218,165,32,0.4)] flex items-center justify-center backface-hidden">
                      <div className="relative w-full h-full p-2">
                        <div className="w-full h-full border-2 border-mystical-gold/30 rounded flex items-center justify-center">
                          <Sparkles className="w-6 h-6 text-mystical-gold/50" />
                        </div>
                      </div>
                      <div className="absolute top-1 right-1 w-6 h-6 bg-mystical-gold rounded-full flex items-center justify-center text-xs font-bold text-purple-900">
                        {idx + 1}
                      </div>
                    </div>
                    
                    {/* 카드 앞면 */}
                    {isRevealed && drawnCards && (
                      <div 
                        className="absolute inset-0 rounded-lg bg-white flex items-center justify-center p-1 backface-hidden shadow-xl"
                        style={{ transform: 'rotateY(180deg)' }}
                      >
                        {(() => {
                          const cardData = drawnCards[idx];
                          if (!cardData) return <div className="text-4xl">🎴</div>;
                          return (
                            <>
                              {cardData.card.imageUrl ? (
                                <img 
                                  src={cardData.card.imageUrl}
                                  alt={cardData.card.nameKo}
                                  className={`w-full h-full object-contain rounded ${cardData.isReversed ? 'rotate-180' : ''}`}
                                />
                              ) : (
                                <div className="text-center">
                                  <div className="text-4xl mb-1">🎴</div>
                                  <p className="text-xs font-bold text-purple-900">{cardData.card.nameKo}</p>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 카드 부채꼴 스프레드 */}
      <div className="relative">
        {/* 회전 버튼 */}
        <button
          onClick={() => rotateFan('left')}
          disabled={isRevealing || selectedCards.length === totalCards}
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-purple-800/90 p-3 md:p-4 rounded-full shadow-2xl hover:bg-purple-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="왼쪽 이동"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={() => rotateFan('right')}
          disabled={isRevealing || selectedCards.length === totalCards}
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-purple-800/90 p-3 md:p-4 rounded-full shadow-2xl hover:bg-purple-700 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="오른쪽 이동"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>

        {selectedCards.length < totalCards && (
          <div className="text-center text-sm text-white/60 mb-4">
            💡 마우스 휠이나 버튼으로 카드를 탐색하세요
          </div>
        )}

        {/* 부채꼴 카드 배치 */}
        <div 
          ref={fanContainerRef}
          className="relative mx-auto overflow-hidden"
          style={{ 
            height: isMobile ? '350px' : '450px',
            maxWidth: '100%'
          }}
        >
          <div className="absolute inset-0 flex items-end justify-center">
            {deckCards.map((cardIndex) => {
              const isSelected = selectedCards.includes(cardIndex);
              
              // 선택된 카드는 별도 영역에 표시하므로 여기서는 숨김
              if (isSelected) return null;
              
              // 부채꼴 배치를 위한 각도 계산
              const position = cardIndex + fanRotation;
              const centerIndex = Math.floor(totalDeckSize / 2);
              const offsetFromCenter = position - centerIndex;
              
              // 가시 범위 확인 (더 넓은 범위)
              const halfVisible = Math.floor(visibleCardCount / 2);
              if (Math.abs(offsetFromCenter) > halfVisible) return null;
              
              // 부채꼴 각도 계산 (120도 범위를 사용하여 더 넓게)
              const maxAngle = isMobile ? 100 : 120; // 부채꼴 펼침 각도
              const anglePerCard = maxAngle / visibleCardCount;
              const angle = offsetFromCenter * anglePerCard;
              const angleRad = (angle * Math.PI) / 180;
              
              // 화면 크기에 따른 반지름 (더 길게)
              const radius = isMobile ? 280 : 380;
              
              // 부채꼴 위치 계산 (아래에서 위로 펼쳐짐)
              const x = Math.sin(angleRad) * radius;
              const y = -Math.cos(angleRad) * radius + radius; // 아래쪽 중심
              
              // 중앙에서 멀어질수록 작아지는 효과
              const distanceFromCenter = Math.abs(offsetFromCenter);
              const scale = 1 - (distanceFromCenter / visibleCardCount) * 0.3;
              const opacity = 0.7 + (1 - distanceFromCenter / visibleCardCount) * 0.3;
              
              // 카드 회전 (부채꼴 효과)
              const cardRotation = angle * 0.7;
              
              return (
                <button
                  key={cardIndex}
                  onClick={() => handleCardClick(cardIndex)}
                  disabled={isRevealing}
                  className={`
                    absolute ${isMobile ? 'w-16' : 'w-20 md:w-24'} aspect-[2/3] rounded-lg transition-all duration-300
                    hover:scale-110 hover:z-20 cursor-pointer
                  `}
                  style={{
                    transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${cardRotation}deg)`,
                    opacity: opacity,
                    left: '50%',
                    top: '0',
                    marginLeft: isMobile ? '-32px' : '-40px',
                    transformOrigin: 'center bottom',
                    zIndex: Math.floor(10 - Math.abs(offsetFromCenter))
                  }}
                >
                    {/* 카드 뒷면 */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 border-2 border-purple-400/50 hover:border-mystical-gold/70 flex items-center justify-center shadow-lg transition-all">
                      <div className="relative w-full h-full p-1.5">
                        <div className="w-full h-full border-2 border-mystical-gold/30 rounded flex items-center justify-center">
                          <div className="text-center">
                            <Sparkles className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-mystical-gold/50 mx-auto mb-1`} />
                            <div className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} border-2 border-mystical-gold/30 rounded-full mx-auto`} />
                          </div>
                        </div>
                      </div>
                    </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes revealCard {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(-50px);
          }
          50% {
            transform: scale(1.2) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-revealCard {
          animation: revealCard 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
