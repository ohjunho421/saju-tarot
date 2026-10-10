import { useState, useRef, useEffect } from 'react';
import type { SpreadType, TarotCard } from '../types';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { tarotApi } from '../services/api';
import {
  SPREAD_CARD_COUNTS,
  POSITION_LABELS,
  ADVICE_LABEL,
  GUIDANCE_MESSAGES,
  ADVICE_CARD_GUIDANCE,
  POSITION_GUIDANCE,
  BASE_CARD_WIDTH,
  BASE_CARD_HEIGHT,
  MAX_BOARD_SCALE,
  getQuestionAwareGuidance,
  getLayoutBounds,
  buildBoardLayout,
  stripGuidanceLabel
} from './cardSelectionConfig';

interface CardSelectionProps {
  spreadType: SpreadType;
  question?: string;
  includeAdviceCard?: boolean;
  onComplete: (selectedCards: { cardIndex: number; isReversed: boolean }[]) => void;
}

function scrollToTop() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}

function CardBack({ compact = false }: { compact?: boolean }) {
  return (
    <div className="relative h-full w-full p-1 md:p-1.5">
      <div className="flex h-full w-full items-center justify-center rounded border-2 border-mystical-gold/30">
        <Sparkles className={`${compact ? 'h-3 w-3' : 'h-4 w-4 md:h-5 md:w-5'} text-mystical-gold/50`} aria-hidden="true" />
      </div>
    </div>
  );
}

export default function CardSelection({ spreadType, question, includeAdviceCard = false, onComplete }: CardSelectionProps) {
  const baseCardCount = SPREAD_CARD_COUNTS[spreadType];
  const totalCards = baseCardCount + (includeAdviceCard ? 1 : 0); // 조언 카드 포함 시 +1
  const [selectedCards, setSelectedCards] = useState<{ deckPosition: number; isReversed: boolean }[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [allRevealed, setAllRevealed] = useState(false); // 모든 카드 공개 완료 여부
  const [fanRotation, setFanRotation] = useState(0);
  const fanContainerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [rootWidth, setRootWidth] = useState(0);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [visibleCardCount, setVisibleCardCount] = useState(21); // 한 번에 보이는 카드 수 (부채꼴용)

  // 더블클릭 및 드래그 상태
  const [previewCard, setPreviewCard] = useState<number | null>(null); // 첫 클릭한 카드 (프리뷰)
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); // 실제로 드래그가 발생했는지
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRotation, setDragStartRotation] = useState(0);

  // 모든 타로 카드 데이터
  const [allTarotCards, setAllTarotCards] = useState<TarotCard[]>([]);
  const totalDeckSize = allTarotCards.length;

  // 카드 덱 (매번 섞임)
  const [deckCards, setDeckCards] = useState<number[]>([]);

  const isPicking = selectedCards.length < totalCards;
  const slotLabels = [...POSITION_LABELS[spreadType], ...(includeAdviceCard ? [ADVICE_LABEL] : [])];

  // 카드 덱 섞기 - 질문이 올때마다 섞임
  useEffect(() => {
    if (allTarotCards.length === 0) return;

    const totalDeckSize = allTarotCards.length;
    const shuffled = Array.from({ length: totalDeckSize }, (_, i) => i);
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setDeckCards(shuffled);
  }, [spreadType, question, allTarotCards]); // spreadType, question, allTarotCards가 변경될 때마다 섞음

  // 타로 카드 데이터 로드
  useEffect(() => {
    const loadCards = async () => {
      try {
        const cards = await tarotApi.getAllCards();
        setAllTarotCards(cards);
      } catch (error) {
        console.error('카드 데이터 로드 실패:', error);
      }
    };
    loadCards();
  }, []);

  // 모바일 체크
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportHeight(window.innerHeight);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 공개 보드 크기 계산용 컨테이너 폭
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const update = () => setRootWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 진입 시, 그리고 다 뽑고 공개 단계로 넘어갈 때 화면 맨 위로
  useEffect(() => {
    scrollToTop();
  }, [isPicking]);

  // 공개가 끝나면 "카드 해석 보기" 버튼이 화면 안에 들어오게 (작은 화면 대비)
  useEffect(() => {
    if (!allRevealed) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctaRef.current?.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [allRevealed]);

  const revealCards = (cards: { deckPosition: number; isReversed: boolean }[]) => {
    setIsRevealing(true);

    // 카드를 하나씩 천천히 뒤집기
    cards.forEach((card, i) => {
      setTimeout(() => {
        setRevealedCards(prev => new Set([...prev, card.deckPosition]));

        // 마지막 카드 뒤집기 완료 후 - 사용자가 결과 확인 버튼을 누를 수 있도록
        if (i === cards.length - 1) {
          setTimeout(() => {
            setAllRevealed(true);
          }, 1200); // 마지막 카드 뒤집기 애니메이션 완료 후 버튼 표시
        }
      }, i * 800); // 카드당 800ms 간격으로 천천히 뒤집기
    });
  };

  const pickCard = (index: number) => {
    if (selectedCards.length >= totalCards) return;

    // 30% 확률로 역방향 결정 (선택 시점에 결정)
    const isReversed = Math.random() < 0.3;
    const newSelected = [...selectedCards, { deckPosition: index, isReversed }];
    setSelectedCards(newSelected);
    setPreviewCard(null);

    // 햅틱 피드백 (모바일)
    if (navigator.vibrate) {
      navigator.vibrate(15);
    }

    // 모든 카드 선택 완료
    if (newSelected.length === totalCards) {
      setTimeout(() => {
        revealCards(newSelected);
      }, 500);
    }
  };

  // 첫 클릭 - 프리뷰, 같은 카드 다시 클릭 - 선택
  const handleCardClick = (index: number) => {
    if (isRevealing || selectedCards.some(c => c.deckPosition === index) || hasDragged) return;

    if (previewCard === index) {
      pickCard(index);
    } else {
      setPreviewCard(index);
    }
  };

  // 화면 크기에 따른 가시 카드 수 조정
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setVisibleCardCount(25); // 모바일: 25장
      } else if (width < 1024) {
        setVisibleCardCount(40); // 태블릿: 40장
      } else {
        setVisibleCardCount(50); // 데스크톱: 50장 (더 많은 카드를 동시에 볼 수 있음)
      }
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  // 부채꼴 회전 함수
  const rotateFan = (direction: 'left' | 'right') => {
    const steps = isMobile ? 2 : 3; // 한 번에 이동할 카드 수

    setFanRotation(prev => {
      const newRotation = direction === 'left' ? prev - steps : prev + steps;

      // 회전 제한: 덱 크기의 절반을 넘지 않도록
      const maxRotation = Math.floor(totalDeckSize / 2) - Math.floor(visibleCardCount / 2);
      const minRotation = -maxRotation;

      // 범위 제한
      return Math.max(minRotation, Math.min(maxRotation, newRotation));
    });
  };

  // 드래그 핸들러
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isRevealing) return;
    setIsDragging(true);
    setHasDragged(false); // 아직 드래그하지 않음
    setDragStartRotation(fanRotation);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || isRevealing) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const deltaX = clientX - dragStartX;

    // 5픽셀 이상 움직이면 드래그로 간주
    if (Math.abs(deltaX) > 5) {
      setHasDragged(true);
    }

    // 민감도 조절 (픽셀당 회전량)
    const sensitivity = isMobile ? 0.05 : 0.08;
    const rotationChange = Math.round(deltaX * sensitivity); // 양수: 손가락 방향과 같은 방향으로 이동

    const newRotation = dragStartRotation + rotationChange;

    // 회전 제한
    const maxRotation = Math.floor(totalDeckSize / 2) - Math.floor(visibleCardCount / 2);
    const minRotation = -maxRotation;

    setFanRotation(Math.max(minRotation, Math.min(maxRotation, newRotation)));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // 드래그가 끝난 후 약간의 딜레이를 두고 hasDragged 리셋
    setTimeout(() => setHasDragged(false), 100);
  };

  // 마우스 휠 이벤트 처리 (덱 크기·가시 카드 수가 바뀌면 최신 값으로 다시 연결)
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
  }, [isRevealing, isMobile, totalDeckSize, visibleCardCount, isPicking]);

  // 전역 드래그 이벤트 (마우스가 컨테이너 밖으로 나가도 추적)
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e as any);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault(); // 브라우저 기본 스크롤 방지
      handleDragMove(e as any);
    };

    const handleEnd = () => {
      handleDragEnd();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false }); // passive: false로 preventDefault 허용
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, dragStartX, dragStartRotation, fanRotation]);

  const currentIndex = selectedCards.length;
  const isAdviceTurn = currentIndex >= baseCardCount;
  const currentLabel = slotLabels[currentIndex] ?? '';
  const questionGuidance = isAdviceTurn ? null : getQuestionAwareGuidance(spreadType, question, currentIndex);
  const currentGuidance = questionGuidance
    ?? stripGuidanceLabel(isAdviceTurn ? ADVICE_CARD_GUIDANCE : (POSITION_GUIDANCE[spreadType][currentIndex] ?? ''));
  const progressPercent = Math.round((selectedCards.length / totalCards) * 100);
  const slotSize = slotLabels.length > 7 ? 'w-8 md:w-12' : 'w-10 md:w-14';

  const renderSlots = () => (
    <ol className="mb-2 flex flex-wrap justify-center gap-1.5 md:mb-4 md:gap-2" aria-label="카드 자리">
      {slotLabels.map((label, idx) => {
        const filled = idx < selectedCards.length;
        const current = idx === currentIndex;
        return (
          <li key={label + idx} className={`${slotSize} flex flex-col items-center gap-1`}>
            <div
              className={`flex aspect-[2/3] w-full items-center justify-center overflow-hidden rounded-md text-xs font-bold transition-colors duration-200 ${
                filled
                  ? 'border border-mystical-gold bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900'
                  : current
                    ? 'border-2 border-mystical-gold bg-mystical-gold/10 text-mystical-gold motion-safe:animate-pulse'
                    : 'border border-dashed border-white/25 text-white/40'
              }`}
            >
              {filled ? <CardBack compact /> : idx >= baseCardCount ? '✨' : idx + 1}
            </div>
            <span className={`w-full truncate text-center text-[10px] md:text-[11px] ${current ? 'text-mystical-gold' : 'text-white/60'}`} title={label}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );

  const renderFan = () => (
    <div className="relative" style={{ overflowX: 'clip' }}> {/* 가로 스크롤 방지하면서 양 끝 카드는 보이게 */}
      {/* 회전 버튼 */}
      <button
        onClick={() => rotateFan('left')}
        disabled={isRevealing}
        className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-purple-800/90 shadow-2xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer md:h-12 md:w-12"
        aria-label="왼쪽 카드 보기"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button
        onClick={() => rotateFan('right')}
        disabled={isRevealing}
        className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-purple-800/90 shadow-2xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer md:h-12 md:w-12"
        aria-label="오른쪽 카드 보기"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {/* 부채꼴 카드 배치 */}
      <div
        ref={fanContainerRef}
        className="relative mx-auto select-none"
        style={{
          height: isMobile ? '200px' : '270px',
          maxWidth: '100%',
          paddingLeft: isMobile ? '40px' : '60px', // 양 끝 카드 선택 가능하도록 패딩 추가
          paddingRight: isMobile ? '40px' : '60px',
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none', // 모바일에서 브라우저 기본 터치 동작 방지
          overflow: 'visible' // 양 끝 카드가 보이도록
        }}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
      >
        <div className="absolute inset-0 flex items-end justify-center">
          {deckCards.map((cardIndex) => {
            const isSelected = selectedCards.some(c => c.deckPosition === cardIndex);

            // 선택된 카드는 슬롯 줄에 표시하므로 여기서는 숨김
            if (isSelected) return null;

            // 부채꼴 배치를 위한 각도 계산
            const position = cardIndex + fanRotation;
            const centerIndex = Math.floor(totalDeckSize / 2);
            const offsetFromCenter = position - centerIndex;

            // 가시 범위 확인
            const halfVisible = Math.floor(visibleCardCount / 2);
            if (Math.abs(offsetFromCenter) > halfVisible) return null;

            // 카드 순서를 0부터 시작하도록 정규화
            const cardSeqIndex = offsetFromCenter + halfVisible; // 0 to visibleCardCount-1
            const progress = cardSeqIndex / (visibleCardCount - 1); // 0(왼쪽) to 1(오른쪽)

            // 부채꼴 형태 - 모바일에서 각도 줄여 양 끝 카드 선택 가능하게
            const maxAngle = isMobile ? 32 : 45;
            const angle = -maxAngle + (progress * maxAngle * 2);
            const angleRad = (angle * Math.PI) / 180;

            // 부채꼴 반지름
            const radius = isMobile ? 250 : 360;

            // 곡선 위치 계산
            const x = Math.sin(angleRad) * radius;
            const y = -Math.cos(angleRad) * radius + radius * 0.8;

            // 스케일과 투명도
            const distanceFromCenter = Math.abs(progress - 0.5);
            const scale = 1.0 - distanceFromCenter * 0.25;
            const opacity = 0.85 + (1 - distanceFromCenter * 2) * 0.15;

            // 카드 회전
            const cardRotation = angle * 0.85;

            const isPreview = previewCard === cardIndex;

            return (
              <button
                key={cardIndex}
                onClick={() => handleCardClick(cardIndex)}
                disabled={isRevealing}
                aria-label={isPreview ? '미리보기 중인 카드, 한 번 더 누르면 뽑습니다' : '카드 미리보기'}
                className={`
                  absolute ${isMobile ? 'w-16' : 'w-20 md:w-24'} aspect-[2/3] rounded-lg transition-all duration-300
                  ${isPreview ? 'scale-110 z-30' : 'hover:scale-110 hover:z-20'} cursor-pointer
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-mystical-gold
                `}
                style={{
                  transform: `translate(${x}px, ${y + (isPreview ? -20 : 0)}px) scale(${scale}) rotate(${cardRotation}deg)`,
                  opacity: opacity,
                  left: '50%',
                  bottom: '8px',
                  marginLeft: isMobile ? '-32px' : '-40px',
                  transformOrigin: 'center bottom',
                  zIndex: isPreview ? 100 : cardSeqIndex
                }}
              >
                  {/* 카드 뒷면 */}
                  <div className={`absolute inset-0 rounded-lg bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 border-2 ${isPreview ? 'border-mystical-gold shadow-mystical-gold/50 shadow-2xl' : 'border-purple-400/50 hover:border-mystical-gold/70'} flex items-center justify-center shadow-lg transition-all`}>
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

      {/* 미리보기 중이면 뽑기 버튼, 아니면 조작 안내 (같은 높이로 자리 고정) */}
      <div className="flex min-h-[48px] items-center justify-center px-2 pt-1">
        {previewCard !== null ? (
          <button
            onClick={() => pickCard(previewCard)}
            className="btn-secondary min-h-[44px] px-8 py-2 cursor-pointer"
          >
            이 카드 뽑기
          </button>
        ) : (
          <p className="text-center text-xs text-white/60 md:text-sm">
            {isMobile
              ? '좌우로 밀어 카드를 고르고, 한 번 탭하면 미리보기, 한 번 더 탭하면 뽑혀요'
              : '드래그나 휠로 넘기고, 한 번 클릭하면 미리보기, 다시 클릭하면 뽑혀요'}
          </p>
        )}
      </div>
    </div>
  );

  const renderBoard = () => {
    const layout = buildBoardLayout(spreadType, includeAdviceCard);
    const bounds = getLayoutBounds(layout, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);
    const availableWidth = Math.max(240, rootWidth - 16);
    // 보드 위(헤더·진행 표시)와 아래(범례·버튼)를 뺀 높이 안에서만 커지게
    const maxBoardHeight = Math.max(240, Math.min(isMobile ? 420 : 460, viewportHeight - (isMobile ? 480 : 470)));
    const scale = Math.min(MAX_BOARD_SCALE, (availableWidth * 0.92) / bounds.width, maxBoardHeight / bounds.height);
    const cardWidth = BASE_CARD_WIDTH * scale;
    const cardHeight = BASE_CARD_HEIGHT * scale;
    const centerX = (bounds.minX + bounds.maxX) / 2;

    return (
      <div className="rounded-xl border-2 border-mystical-gold/30 bg-gradient-to-br from-mystical-gold/10 to-purple-600/10 px-2 py-6 md:py-8">
        <div className="relative mx-auto" style={{ height: bounds.height * scale }}>
          {selectedCards.map((selectedCard, idx) => {
            const { deckPosition, isReversed } = selectedCard;
            const pos = layout[idx];
            if (!pos) return null;
            const isRevealed = revealedCards.has(deckPosition);
            const reversedRotation = isReversed && isRevealed ? 180 : 0; // 역방향 카드는 공개 후 180도 회전
            const tarotCard = allTarotCards[deckCards[deckPosition]];
            const badgeStyle = pos.rotation === 90
              ? { left: (cardWidth + cardHeight) / 2 - 10, top: (cardHeight - cardWidth) / 2 - 6 }
              : { left: -6, top: -6 };

            return (
              <div
                key={deckPosition}
                className="absolute"
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  left: `calc(50% + ${(pos.x - centerX) * scale}px)`,
                  top: (pos.y - bounds.minY) * scale,
                  transform: 'translate(-50%, -50%)',
                  perspective: '1000px'
                }}
              >
                <div
                  className="relative h-full w-full rounded-lg transition-transform duration-[1200ms] ease-in-out motion-reduce:transition-none"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${isRevealed ? 180 : 0}deg) rotate(${(pos.rotation || 0) + reversedRotation}deg)`
                  }}
                >
                  {/* 카드 뒷면 */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 border-2 border-mystical-gold shadow-[0_0_20px_rgba(218,165,32,0.4)] backface-hidden">
                    <CardBack />
                  </div>

                  {/* 카드 앞면 */}
                  {isRevealed && (
                    <div
                      className="absolute inset-0 rounded-lg bg-white flex items-center justify-center p-1 backface-hidden shadow-xl overflow-hidden"
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      {tarotCard?.imageUrl ? (
                        <img src={tarotCard.imageUrl} alt={tarotCard.nameKo} className="w-full h-full object-cover rounded" />
                      ) : (
                        <p className="text-center text-xs font-bold text-purple-900">{tarotCard?.nameKo ?? '선택됨'}</p>
                      )}
                      {isReversed && (
                        <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                          역
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 자리 번호 (뒤집어도 보이도록 카드 밖에 둠) */}
                <span
                  className="absolute z-10 flex h-5 w-5 items-center justify-center rounded-full bg-mystical-gold text-[11px] font-bold text-purple-900 shadow"
                  style={badgeStyle}
                  aria-hidden="true"
                >
                  {idx >= baseCardCount ? '✨' : idx + 1}
                </span>
              </div>
            );
          })}
        </div>

        {/* 자리 범례 */}
        <ol className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-white/80 md:text-sm">
          {slotLabels.map((label, idx) => (
            <li key={label + idx} className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mystical-gold/20 text-[11px] font-bold text-mystical-gold">
                {idx >= baseCardCount ? '✨' : idx + 1}
              </span>
              {label}
            </li>
          ))}
        </ol>
      </div>
    );
  };

  return (
    <div ref={rootRef} className="max-w-5xl mx-auto px-1 md:px-4">
      {/* 상단 바: 진행 상황 + 지금 뽑을 자리 */}
      <header className="mb-3 text-center md:mb-5">
        {question && (
          <p className="mx-auto mb-2 max-w-xl truncate rounded-full bg-white/5 px-4 py-1.5 text-sm text-white/80" title={question}>
            "{question}"
          </p>
        )}
        <div className="flex items-center justify-center gap-3" aria-live="polite">
          <span className="text-sm font-semibold text-mystical-gold">
            {selectedCards.length}/{totalCards} 선택
          </span>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10 md:w-48" aria-hidden="true">
            <div className="h-full rounded-full bg-mystical-gold transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {isPicking ? (
          <>
            {selectedCards.length === 0 && (
              <p className="mx-auto mt-2 hidden max-w-2xl text-sm text-white/60 md:block">{GUIDANCE_MESSAGES[spreadType]}</p>
            )}
            <p className="mt-2 text-xs text-white/60">지금 뽑을 카드</p>
            <p className="font-serif text-xl font-semibold text-mystical-gold md:text-2xl">{currentLabel}</p>
            <p className="mx-auto mt-1 max-w-2xl text-sm text-white/80 line-clamp-2 break-keep">{currentGuidance}</p>
          </>
        ) : (
          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-mystical-gold">
            {allRevealed ? (
              '모든 카드가 공개됐어요'
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-mystical-gold motion-safe:animate-bounce" />
                카드를 공개하고 있어요 ({revealedCards.size}/{totalCards})
              </>
            )}
          </div>
        )}
      </header>

      {isPicking ? (
        <>
          {renderSlots()}
          {renderFan()}
        </>
      ) : (
        <>
          {renderBoard()}
          <div ref={ctaRef} className="mt-6 flex min-h-[60px] justify-center">
            {allRevealed && (
              <button
                onClick={() => {
                  const cardsToSend = selectedCards.map(c => ({
                    cardIndex: deckCards[c.deckPosition],
                    isReversed: c.isReversed
                  }));
                  onComplete(cardsToSend);
                }}
                className="btn-primary text-lg px-10 py-4 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 inline-block mr-2" />
                카드 해석 보기
              </button>
            )}
          </div>
        </>
      )}

      <style>{`
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
