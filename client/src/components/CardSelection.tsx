import { useState, useRef, useEffect } from 'react';
import type { SpreadType, TarotCard } from '../types';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { tarotApi } from '../services/api';

interface CardSelectionProps {
  spreadType: SpreadType;
  question?: string;
  includeAdviceCard?: boolean;
  onComplete: (selectedCards: { cardIndex: number; isReversed: boolean }[]) => void;
}

const SPREAD_CARD_COUNTS: Record<SpreadType, number> = {
  'one-card': 1,
  'two-card': 2,
  'three-card': 3,
  'six-months': 6,
  'celtic-cross': 10,
  'saju-custom': 5,
  'yes-no': 1,
  'problem-solution': 2,
  'compatibility': 4,
  'daily-fortune': 3
};

const GUIDANCE_MESSAGES: Record<SpreadType, string> = {
  'one-card': '마음을 가라앉히고, 질문에 집중하며 한 장의 카드를 선택하세요.',
  'two-card': '두 가지 선택지를 떠올리며 각각을 대표하는 카드를 선택하세요.',
  'three-card': '과거, 현재, 미래를 생각하며 세 장의 카드를 차례로 선택하세요.',
  'six-months': '향후 6개월의 흐름을 살펴보며 매달의 카드를 차례로 선택하세요.',
  'celtic-cross': '당신의 인생 전체를 아우르는 복잡한 상황을 떠올리며 열 장을 선택하세요.',
  'saju-custom': '당신의 사주와 오행을 생각하며 다섯 장의 카드를 선택하세요.',
  'yes-no': '마음속 질문을 떠올리며 직관적으로 한 장의 카드를 선택하세요.',
  'problem-solution': '현재 직면한 문제를 떠올리며 두 장의 카드를 선택하세요.',
  'compatibility': '두 사람의 에너지와 인연을 떠올리며 네 장의 카드를 차례로 선택하세요.',
  'daily-fortune': '오늘 하루의 운세를 살펴봅니다. 총운, 금전운, 연애운 카드를 차례로 선택하세요.'
};

// 사용자 질문에서 선택지(A/B/C 등)를 파싱하는 함수
function parseChoicesFromQuestion(question?: string): string[] {
  if (!question) return [];
  
  // 패턴 1: "A가 좋을까 B가 좋을까 C가 좋을까" / "A가 나을까 B가 나을까"
  const choicePattern1 = /([^,?\s가이을를][^,?가이을를]{0,20})(?:가|이|을|를)\s*(?:좋을까|나을까|맞을까|괜찮을까|좋은|나은|맞는|좋겠|나을|할까)/g;
  const matches1: string[] = [];
  let m;
  while ((m = choicePattern1.exec(question)) !== null) {
    matches1.push(m[1].trim());
  }
  if (matches1.length >= 2) return matches1;

  // 패턴 2: "A vs B" / "A 아니면 B"
  const vsMatch = question.match(/(.+?)\s*(?:vs|VS|아니면|또는|혹은)\s*(.+?)(?:\s*(?:vs|VS|아니면|또는|혹은)\s*(.+?))?(?:\?|$)/i);
  if (vsMatch) {
    const choices = [vsMatch[1].trim(), vsMatch[2].trim()];
    if (vsMatch[3]) choices.push(vsMatch[3].trim());
    return choices.filter(c => c.length > 0 && c.length <= 30);
  }

  // 패턴 3: "A, B, C 중에" / "A B C 중에서"
  const listMatch = question.match(/(.+?)\s*중에?서?/i);
  if (listMatch) {
    const items = listMatch[1].split(/[,，]|\s+(?:그리고|와|과|하고)\s+/).map(s => s.trim()).filter(s => s.length > 0 && s.length <= 30);
    if (items.length >= 2) return items;
  }

  return [];
};

// 질문 기반 동적 가이던스 메시지 생성
function getQuestionAwareGuidance(spreadType: SpreadType, question?: string, cardIndex?: number): string | null {
  const choices = parseChoicesFromQuestion(question);
  if (choices.length < 2) return null;
  
  // two-card: 각 선택지에 대한 카드
  if (spreadType === 'two-card' && cardIndex !== undefined && cardIndex < choices.length) {
    return `⬅️ "${choices[cardIndex]}" - 이 선택지의 에너지를 느끼며 카드를 뽑아주세요`;
  }
  
  // three-card: 선택지가 3개면 각각, 2개면 A/B/결과
  if (spreadType === 'three-card' && cardIndex !== undefined) {
    if (choices.length >= 3 && cardIndex < 3) {
      return `🔮 "${choices[cardIndex]}" - 이 선택지의 에너지를 느끼며 카드를 뽑아주세요`;
    }
    if (choices.length === 2) {
      if (cardIndex === 0) return `⬅️ "${choices[0]}" - 이 선택의 결과를 떠올리며 카드를 뽑아주세요`;
      if (cardIndex === 1) return `➡️ "${choices[1]}" - 이 선택의 결과를 떠올리며 카드를 뽑아주세요`;
      if (cardIndex === 2) return `🔮 최종 조언 - 어떤 선택이 더 나은지 카드에게 물으며 뽑아주세요`;
    }
  }
  
  return null;
}

// 조언 카드 안내 메시지
const ADVICE_CARD_GUIDANCE = '✨ 조언 카드 - 앞으로 나아갈 방향과 실천할 수 있는 지혜를 구하며 마지막 카드를 선택하세요';

// 각 스프레드의 카드별 선택 안내 메시지
const POSITION_GUIDANCE: Record<SpreadType, string[]> = {
  'one-card': [
    '💫 지금 이 순간, 당신이 가장 궁금한 질문에 집중하며 직관적으로 카드를 선택하세요'
  ],
  'three-card': [
    '🕰️ 과거 - 이 상황이 시작된 계기나 원인이 되었던 과거의 경험을 떠올리며 카드를 선택하세요',
    '⏳ 현재 - 지금 이 순간 당신이 느끼는 감정과 처한 상황을 생각하며 카드를 선택하세요',
    '🔮 미래 - 이 상황이 어떻게 전개될지, 당신이 기대하는 결과를 상상하며 카드를 선택하세요'
  ],
  'celtic-cross': [
    '🎯 현재 상황 - 지금 당신을 둘러싼 전체적인 상황과 분위기를 느끼며 카드를 선택하세요',
    '⚔️ 장애물 - 당신을 가로막고 있는 어려움, 저항, 갈등을 떠올리며 카드를 선택하세요',
    '🌟 목표 - 당신이 진정으로 원하는 것, 이루고 싶은 바람을 생각하며 카드를 선택하세요',
    '📚 먼 과거 - 이 상황의 뿌리가 된 오래된 기억이나 근본 원인을 떠올리며 카드를 선택하세요',
    '⏮️ 최근 과거 - 막 지나간 사건이나 최근에 겪은 변화를 생각하며 카드를 선택하세요',
    '⏭️ 가까운 미래 - 머지않아 다가올 사건이나 곧 맞이할 변화를 예상하며 카드를 선택하세요',
    '💭 당신의 태도 - 이 상황을 대하는 당신의 마음가짐과 내면의 자세를 돌아보며 카드를 선택하세요',
    '🌍 주변 영향 - 당신을 둘러싼 환경, 타인, 외부 요인들을 생각하며 카드를 선택하세요',
    '❤️ 희망과 두려움 - 당신이 진심으로 바라는 것과 두려워하는 것을 느끼며 카드를 선택하세요',
    '🎊 최종 결과 - 현재의 흐름이 이어질 때 도달하게 될 결말을 상상하며 카드를 선택하세요'
  ],
  'six-months': [
    '📅 이번 달 - 지금부터 시작되는 한 달의 에너지와 주요 사건을 떠올리며 카드를 선택하세요',
    '📅 다음 달 - 한 달 후의 상황과 맞이할 변화를 상상하며 카드를 선택하세요',
    '📅 2개월 후 - 두 달 후의 흐름과 중요한 결정을 생각하며 카드를 선택하세요',
    '📅 3개월 후 - 세 달 후의 전개와 새로운 국면을 예상하며 카드를 선택하세요',
    '📅 4개월 후 - 네 달 후의 상황과 성숙된 변화를 느끼며 카드를 선택하세요',
    '📅 5개월 후 - 다섯 달 후의 결실과 완성을 바라보며 카드를 선택하세요'
  ],
  'saju-custom': [
    '🌱 목(木) 기운 - 당신의 성장, 창의성, 새로운 시작의 에너지를 느끼며 카드를 선택하세요',
    '🔥 화(火) 기운 - 당신의 열정, 추진력, 활발한 활동의 에너지를 느끼며 카드를 선택하세요',
    '🏔️ 토(土) 기운 - 당신의 안정감, 신뢰, 중심을 잡는 에너지를 느끼며 카드를 선택하세요',
    '⚔️ 금(金) 기운 - 당신의 결단력, 변화, 정리하는 에너지를 느끼며 카드를 선택하세요',
    '💧 수(水) 기운 - 당신의 지혜, 유연성, 흐르는 에너지를 느끼며 카드를 선택하세요'
  ],
  'two-card': [
    '⬅️ 선택지 A - 첫 번째 옵션을 대표하는 에너지를 느끼며 카드를 선택하세요',
    '➡️ 선택지 B - 두 번째 옵션을 대표하는 에너지를 느끼며 카드를 선택하세요'
  ],
  'yes-no': [
    '✨ 마음속 질문에 대한 답을 구하며 직관적으로 카드를 선택하세요'
  ],
  'problem-solution': [
    '🔍 문제의 원인 - 현재 어려움의 근본 원인을 떠올리며 카드를 선택하세요',
    '💡 해결책 - 이 상황을 해결할 방법을 구하며 카드를 선택하세요'
  ],
  'compatibility': [
    '🌟 나의 기운 - 지금 이 관계에서 내가 가진 에너지와 마음을 느끼며 카드를 선택하세요',
    '💫 상대방의 기운 - 상대방이 이 관계에서 가진 에너지와 마음을 떠올리며 카드를 선택하세요',
    '💑 두 사람의 관계 - 우리 사이에 흐르는 에너지와 연결을 느끼며 카드를 선택하세요',
    '🔮 앞으로의 흐름 - 이 관계가 나아갈 방향과 미래를 상상하며 카드를 선택하세요'
  ],
  'daily-fortune': [
    '☀️ 총운 카드 - 오늘 하루의 전체적인 기운과 흐름을 느끼며 카드를 뽑아주세요',
    '💰 금전운 카드 - 오늘의 재물과 금전 흐름을 떠올리며 카드를 뽑아주세요',
    '💕 연애운 카드 - 오늘의 사랑과 인연의 기운을 느끼며 카드를 뽑아주세요'
  ]
};

// 스프레드별 카드 배치 위치 (x, y는 백분율 또는 상대 위치)
type CardPosition = { x: number; y: number; rotation?: number };
const SPREAD_LAYOUTS: Record<SpreadType, CardPosition[]> = {
  'one-card': [
    { x: 0, y: 0 }
  ],
  'three-card': [
    { x: -150, y: 0 },
    { x: 0, y: 0 },
    { x: 150, y: 0 }
  ],
  'celtic-cross': [
    { x: 0, y: 0 },           // 1. 현재
    { x: 0, y: 0, rotation: 90 }, // 2. 장애물 (가로로)
    { x: 0, y: -120 },         // 3. 목표
    { x: 0, y: 120 },          // 4. 과거
    { x: -120, y: 0 },         // 5. 최근
    { x: 120, y: 0 },          // 6. 미래
    { x: 240, y: 120 },        // 7. 자신
    { x: 240, y: 0 },          // 8. 환경
    { x: 240, y: -120 },       // 9. 희망/두려움
    { x: 240, y: -240 }        // 10. 결과
  ],
  'six-months': [
    { x: -250, y: 0 },   // 이번 달
    { x: -150, y: 0 },   // 다음 달
    { x: -50, y: 0 },    // 2개월 후
    { x: 50, y: 0 },     // 3개월 후
    { x: 150, y: 0 },    // 4개월 후
    { x: 250, y: 0 }     // 5개월 후
  ],
  'saju-custom': [
    { x: -200, y: 0 },   // 목
    { x: -100, y: -80 }, // 화
    { x: 0, y: 0 },      // 토 (중앙)
    { x: 100, y: -80 },  // 금
    { x: 200, y: 0 }     // 수
  ],
  'two-card': [
    { x: -100, y: 0 },   // 선택지 A
    { x: 100, y: 0 }     // 선택지 B
  ],
  'yes-no': [
    { x: 0, y: 0 }       // 답변
  ],
  'problem-solution': [
    { x: -100, y: 0 },   // 문제의 원인
    { x: 100, y: 0 }     // 해결책
  ],
  'compatibility': [
    { x: -150, y: -60 }, // 나의 기운 (왼쪽 위)
    { x: 150, y: -60 },  // 상대방의 기운 (오른쪽 위)
    { x: 0, y: 60 },     // 두 사람의 관계 (중앙 아래)
    { x: 0, y: -120 }    // 앞으로의 흐름 (중앙 위)
  ],
  'daily-fortune': [
    { x: -150, y: 0 },   // 총운
    { x: 0, y: 0 },      // 금전운
    { x: 150, y: 0 }     // 연애운
  ]
};

// 레이아웃의 범위를 계산하는 함수
function getLayoutBounds(layout: CardPosition[], cardWidth: number, cardHeight: number) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  layout.forEach(pos => {
    // 회전된 카드의 경우 대략적인 범위 계산 (90도 회전 시 width/height 교체)
    const effectiveWidth = pos.rotation === 90 ? cardHeight : cardWidth;
    const effectiveHeight = pos.rotation === 90 ? cardWidth : cardHeight;
    
    minX = Math.min(minX, pos.x - effectiveWidth / 2);
    maxX = Math.max(maxX, pos.x + effectiveWidth / 2);
    minY = Math.min(minY, pos.y - effectiveHeight / 2);
    maxY = Math.max(maxY, pos.y + effectiveHeight / 2);
  });
  
  return {
    minX, maxX, minY, maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export default function CardSelection({ spreadType, question, includeAdviceCard = false, onComplete }: CardSelectionProps) {
  const baseCardCount = SPREAD_CARD_COUNTS[spreadType];
  const totalCards = baseCardCount + (includeAdviceCard ? 1 : 0); // 조언 카드 포함 시 +1
  const [selectedCards, setSelectedCards] = useState<{ deckPosition: number; isReversed: boolean }[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set());
  const [fanRotation, setFanRotation] = useState(0);
  const fanContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
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

  // 카드 덱 생성 (78장) - 매번 섞임
  // 카드 덱 생성 (매번 섞임)
  // const totalDeckSize = 78; // Removed hardcoded size
  const [deckCards, setDeckCards] = useState<number[]>([]);

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
    console.log('🔀 Deck shuffled (' + totalDeckSize + ' cards)');
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
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 첫 클릭 - 프리뷰 모드
  const handleCardClick = (index: number) => {
    if (isRevealing || selectedCards.some(c => c.deckPosition === index) || hasDragged) return;
    
    if (previewCard === index) {
      // 같은 카드를 다시 클릭 - 실제 선택
      if (selectedCards.length < totalCards) {
        // 30% 확률로 역방향 결정 (선택 시점에 결정)
        const isReversed = Math.random() < 0.3;
        const newSelected = [...selectedCards, { deckPosition: index, isReversed }];
        setSelectedCards(newSelected);
        setPreviewCard(null);
        
        console.log(`🎴 카드 선택: 덱 위치 ${index}, 역방향: ${isReversed}`);
        
        // 모든 카드 선택 완료
        if (newSelected.length === totalCards) {
          setTimeout(() => {
            revealCards(newSelected);
          }, 500);
        }
      }
    } else {
      // 다른 카드 클릭 - 프리뷰 모드로 전환
      setPreviewCard(index);
    }
  };

  const revealCards = (cards: { deckPosition: number; isReversed: boolean }[]) => {
    setIsRevealing(true);
    
    // 카드를 하나씩 천천히 뒤집기
    cards.forEach((card, i) => {
      setTimeout(() => {
        setRevealedCards(prev => new Set([...prev, card.deckPosition]));
        
        // 마지막 카드 뒤집기 완료 후
        if (i === cards.length - 1) {
          setTimeout(() => {
            // 선택한 위치의 실제 카드 번호와 역방향 정보를 서버에 전송
            const cardsToSend = cards.map(c => ({
              cardIndex: deckCards[c.deckPosition],
              isReversed: c.isReversed
            }));
            console.log('📤 서버로 전송:', cardsToSend);
            onComplete(cardsToSend);
          }, 8000); // 8초 대기 - 사용자가 카드를 충분히 볼 수 있도록
        }
      }, i * 800); // 카드당 800ms 간격으로 천천히 뒤집기
    });
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
        
        {selectedCards.length === 0 ? (
          <div>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-3">
              {GUIDANCE_MESSAGES[spreadType]}
            </p>
            <p className="text-lg text-mystical-gold animate-pulse font-semibold">
              🌟 {getQuestionAwareGuidance(spreadType, question, 0) || POSITION_GUIDANCE[spreadType][0]}
            </p>
          </div>
        ) : selectedCards.length < totalCards ? (
          <div className="mt-4">
            <p className="text-base text-white/70 mb-2">
              {selectedCards.length + 1}번째 카드 선택
            </p>
            <p className="text-lg text-mystical-gold animate-pulse font-semibold">
              🌟 {selectedCards.length >= baseCardCount
                ? ADVICE_CARD_GUIDANCE
                : (getQuestionAwareGuidance(spreadType, question, selectedCards.length) || POSITION_GUIDANCE[spreadType][selectedCards.length])}
            </p>
          </div>
        ) : null}
        
        {isRevealing && (
          <p className="text-sm text-mystical-gold mt-4 animate-pulse">
            ✨ 카드를 공개하고 있습니다...
          </p>
        )}
      </div>

      {/* 선택된 카드 표시 영역 - 스프레드별 배치 */}
      {selectedCards.length > 0 && (
        <div className="mb-8">
          <div className="relative bg-gradient-to-br from-mystical-gold/10 to-purple-600/10 rounded-xl border-2 border-mystical-gold/30 p-12 md:p-16 overflow-hidden" style={{ minHeight: isMobile ? '450px' : '600px' }}>
            <div className="relative" style={{ height: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '40px' }}>
              {(() => {
                // 카드 크기 계산 (px 단위)
                const cardWidthPx = isMobile ? 64 : 80; // w-16 = 64px, w-20 = 80px
                const cardHeightPx = cardWidthPx * 1.5; // aspect-[2/3]
                
                // 현재 스프레드의 레이아웃 (조언 카드 포함)
                let currentLayout = [...SPREAD_LAYOUTS[spreadType]];
                
                // 조언 카드가 활성화되어 있으면 레이아웃에 추가
                if (includeAdviceCard) {
                  // 조언 카드 위치: 기존 카드 레이아웃 아래에 배치
                  currentLayout.push({ x: 0, y: 150 });
                }
                
                // 레이아웃의 실제 범위 계산
                const bounds = getLayoutBounds(currentLayout, cardWidthPx, cardHeightPx);
                
                // 박스의 사용 가능한 공간 계산 (padding 제외)
                const paddingPx = isMobile ? 48 : 64; // p-12 = 48px, p-16 = 64px
                const minHeightPx = isMobile ? 450 : 600;
                const availableWidth = (isMobile ? window.innerWidth : 1280) - paddingPx * 2; // 최대 너비 제한
                const availableHeight = minHeightPx - paddingPx * 2;
                
                // 스케일 팩터 계산 (여유 공간 20% 확보 - 더 넓게)
                const scaleX = bounds.width > 0 ? (availableWidth * 0.8) / bounds.width : 1;
                const scaleY = bounds.height > 0 ? (availableHeight * 0.8) / bounds.height : 1;
                const scale = Math.min(scaleX, scaleY, 1); // 확대는 하지 않고 축소만
                
                return selectedCards.map((selectedCard, idx) => {
                  const { deckPosition, isReversed } = selectedCard;
                  const isRevealed = revealedCards.has(deckPosition);
                  const layout = currentLayout[idx];
                  const cardSize = isMobile ? 'w-16' : 'w-20 md:w-24';
                  
                  // 레이아웃이 없으면 스킵 (안전장치)
                  if (!layout) {
                    console.error(`레이아웃을 찾을 수 없습니다: idx=${idx}, totalCards=${totalCards}`);
                    return null;
                  }
                  
                  // 스케일링된 좌표
                  const scaledX = layout.x * scale;
                  const scaledY = layout.y * scale;
                  
                  // 역방향 카드는 180도 회전 (공개 후에만)
                  const reversedRotation = isReversed && isRevealed ? 180 : 0;
                  
                  return (
                    <div
                      key={deckPosition}
                      className="absolute"
                      style={{
                        transform: `translate(${scaledX}px, ${scaledY}px)`,
                        opacity: 1
                        // 카드는 선택되자마자 즉시 패딩 영역에 표시됨 (뒷면)
                      }}
                    >
                    <div 
                      className={`${cardSize} aspect-[2/3] rounded-lg`}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: `${isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)'} rotate(${(layout.rotation || 0) + reversedRotation}deg)`,
                        transition: 'transform 1.2s ease-in-out'
                        // 뒤집기 애니메이션만 (이동 없음)
                      }}
                    >
                      {/* 카드 뒷면 */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-700 via-indigo-800 to-purple-900 border-2 border-mystical-gold shadow-[0_0_20px_rgba(218,165,32,0.4)] flex items-center justify-center backface-hidden">
                        <div className="relative w-full h-full p-1.5 md:p-2">
                          <div className="w-full h-full border-2 border-mystical-gold/30 rounded flex items-center justify-center">
                            <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-mystical-gold/50" />
                          </div>
                        </div>
                        <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-5 h-5 md:w-6 md:h-6 bg-mystical-gold rounded-full flex items-center justify-center text-xs font-bold text-purple-900">
                          {idx >= baseCardCount ? '✨' : idx + 1}
                        </div>
                      </div>
                      
                      {/* 카드 앞면 */}
                      {isRevealed && allTarotCards.length > 0 && deckCards.length > 0 && (() => {
                        // deckPosition은 선택한 위치이고, 실제 카드 번호는 deckCards에서 가져옴
                        const actualCardNumber = deckCards[deckPosition];
                        const tarotCard = allTarotCards[actualCardNumber];
                        if (!tarotCard) {
                          return (
                            <div 
                              className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-100 to-white flex items-center justify-center p-2 backface-hidden shadow-xl"
                              style={{ transform: 'rotateY(180deg)' }}
                            >
                              <div className="text-center">
                                <div className="text-4xl md:text-5xl mb-2">🎴</div>
                                <p className="text-sm md:text-base font-bold text-purple-900">선택됨</p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div 
                            className="absolute inset-0 rounded-lg bg-white flex items-center justify-center p-1 backface-hidden shadow-xl overflow-hidden"
                            style={{ transform: 'rotateY(180deg)' }}
                          >
                            {tarotCard.imageUrl ? (
                              <img 
                                src={tarotCard.imageUrl}
                                alt={tarotCard.nameKo}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <div className="text-center p-2">
                                <div className="text-3xl md:text-4xl mb-1">🎴</div>
                                <p className="text-xs font-bold text-purple-900">{tarotCard.nameKo}</p>
                              </div>
                            )}
                            {/* 역방향 표시 배지 */}
                            {isReversed && (
                              <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                                역
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })})()}
            </div>
          </div>
        </div>
      )}

      {/* 카드 부채꼴 스프레드 */}
      <div className="relative" style={{ overflowX: 'clip' }}> {/* 가로 스크롤 방지하면서 양 끝 카드는 보이게 */}
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
            💡 {isMobile ? '터치로 좌우 드래그' : '마우스로 드래그하거나 휠로 카드를 탐색하세요'}
            <br />
            <span className="text-mystical-gold text-xs mt-1 inline-block">
              ✨ 카드를 한 번 클릭하면 프리뷰, 다시 클릭하면 선택됩니다
            </span>
          </div>
        )}

        {/* 부채꼴 카드 배치 */}
        <div 
          ref={fanContainerRef}
          className="relative mx-auto select-none"
          style={{ 
            height: isMobile ? '400px' : '480px',
            maxWidth: '100%',
            paddingTop: isMobile ? '40px' : '60px',
            paddingLeft: isMobile ? '40px' : '60px', // 양 끝 카드 선택 가능하도록 패딩 추가
            paddingRight: isMobile ? '40px' : '60px',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none', // 모바일에서 브라우저 기본 터치 동작 방지
            overflow: 'visible' // 양 끝 카드가 보이도록 변경
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="absolute inset-0 flex items-end justify-center">
            {deckCards.map((cardIndex) => {
              const isSelected = selectedCards.some(c => c.deckPosition === cardIndex);
              
              // 선택된 카드는 별도 영역에 표시하므로 여기서는 숨김
              if (isSelected) return null;
              
              // 부채꼴 배치를 위한 각도 계산
              const position = cardIndex + fanRotation;
              const centerIndex = Math.floor(totalDeckSize / 2);
              const offsetFromCenter = position - centerIndex;
              
              // 가시 범위 확인 (더 넓은 범위)
              const halfVisible = Math.floor(visibleCardCount / 2);
              if (Math.abs(offsetFromCenter) > halfVisible) return null;
              
              // 카드 순서를 0부터 시작하도록 정규화
              const cardSeqIndex = offsetFromCenter + halfVisible; // 0 to visibleCardCount-1
              const progress = cardSeqIndex / (visibleCardCount - 1); // 0(왼쪽) to 1(오른쪽)
              
              // U자 부채꼴 형태 유지 - 모바일에서 각도 줄여 양 끝 카드 선택 가능하게
              const maxAngle = isMobile ? 32 : 45; // 모바일 각도 축소 (40 -> 32)
              const angle = -maxAngle + (progress * maxAngle * 2);
              const angleRad = (angle * Math.PI) / 180;
              
              // 부채꼴 반지름 - 모바일에서 약간 축소
              const radius = isMobile ? 250 : 360; // 모바일 반지름 축소 (280 -> 250)
              
              // U자 곡선 위치 계산
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
                  className={`
                    absolute ${isMobile ? 'w-16' : 'w-20 md:w-24'} aspect-[2/3] rounded-lg transition-all duration-300
                    ${isPreview ? 'scale-110 z-30' : 'hover:scale-110 hover:z-20'} cursor-pointer
                  `}
                  style={{
                    transform: `translate(${x}px, ${y + (isPreview ? -20 : 0)}px) scale(${scale}) rotate(${cardRotation}deg)`,
                    opacity: opacity,
                    left: '50%',
                    bottom: '20px',
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
      </div>

      <style>{`
        @keyframes revealCard {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
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
