import type { SpreadType } from '../types';

// 카드 선택 화면의 스프레드별 정적 설정과 순수 계산 함수

export const SPREAD_CARD_COUNTS: Record<SpreadType, number> = {
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

// 자리 이름: 서버 SPREAD_POSITIONS(server/src/models/tarot.model.ts)와 같아야 AI 해석 자리와 일치한다
export const POSITION_LABELS: Record<SpreadType, string[]> = {
  'one-card': ['현재 상황'],
  'two-card': ['선택지 A', '선택지 B'],
  'three-card': ['과거', '현재', '미래'],
  'celtic-cross': ['현재 상황', '장애물/도전', '의식적 목표', '무의식적 영향', '과거', '가까운 미래', '자신의 태도', '외부 영향', '희망과 두려움', '최종 결과'],
  'saju-custom': ['목(木) 기운', '화(火) 기운', '토(土) 기운', '금(金) 기운', '수(水) 기운'],
  'six-months': ['이번 달', '다음 달', '2개월 후', '3개월 후', '4개월 후', '5개월 후'],
  'yes-no': ['답변'],
  'problem-solution': ['문제의 원인', '해결책'],
  'compatibility': ['나의 기운', '상대방의 기운', '두 사람의 관계', '앞으로의 흐름'],
  'daily-fortune': ['총운', '금전운', '연애운']
};

export const ADVICE_LABEL = '조언 카드';

export const GUIDANCE_MESSAGES: Record<SpreadType, string> = {
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
export function parseChoicesFromQuestion(question?: string): string[] {
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
export function getQuestionAwareGuidance(spreadType: SpreadType, question?: string, cardIndex?: number): string | null {
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
export const ADVICE_CARD_GUIDANCE = '✨ 조언 카드 - 앞으로 나아갈 방향과 실천할 수 있는 지혜를 구하며 마지막 카드를 선택하세요';

// 각 스프레드의 카드별 선택 안내 메시지
export const POSITION_GUIDANCE: Record<SpreadType, string[]> = {
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
    '🌟 의식적 목표 - 당신이 진정으로 원하는 것, 이루고 싶은 바람을 생각하며 카드를 선택하세요',
    '🌊 무의식적 영향 - 마음 깊은 곳에서 이 상황을 움직이는 감정이나 오래된 습관을 떠올리며 카드를 선택하세요',
    '⏮️ 과거 - 막 지나간 사건이나 이 상황을 만든 최근의 변화를 생각하며 카드를 선택하세요',
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

// 스프레드별 카드 배치 (카드 중심 좌표, 기준 카드 80x120px)
export type CardPosition = { x: number; y: number; rotation?: number };
export const SPREAD_LAYOUTS: Record<SpreadType, CardPosition[]> = {
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
    { x: 0, y: 120 },          // 4. 무의식
    { x: -120, y: 0 },         // 5. 과거
    { x: 120, y: 0 },          // 6. 미래
    { x: 240, y: 120 },        // 7. 자신
    { x: 240, y: 0 },          // 8. 환경
    { x: 240, y: -120 },       // 9. 희망/두려움
    { x: 240, y: -240 }        // 10. 결과
  ],
  'six-months': [
    { x: -110, y: -80 },  // 이번 달
    { x: 0, y: -80 },     // 다음 달
    { x: 110, y: -80 },   // 2개월 후
    { x: -110, y: 80 },   // 3개월 후
    { x: 0, y: 80 },      // 4개월 후
    { x: 110, y: 80 }     // 5개월 후
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

export const BASE_CARD_WIDTH = 80;
export const BASE_CARD_HEIGHT = 120;
export const MAX_BOARD_SCALE = 1.6;

// 레이아웃의 범위를 계산하는 함수 (좌표는 카드 중심)
export function getLayoutBounds(layout: CardPosition[], cardWidth: number, cardHeight: number) {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  layout.forEach(pos => {
    // 90도 회전 카드는 width/height 교체
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

// 조언 카드는 기존 배치와 겹치지 않도록 레이아웃 맨 아래 가운데에 둔다
export function buildBoardLayout(spreadType: SpreadType, includeAdviceCard: boolean): CardPosition[] {
  const layout = [...SPREAD_LAYOUTS[spreadType]];
  if (!includeAdviceCard) return layout;
  const bounds = getLayoutBounds(layout, BASE_CARD_WIDTH, BASE_CARD_HEIGHT);
  return [...layout, { x: (bounds.minX + bounds.maxX) / 2, y: bounds.maxY + 24 + BASE_CARD_HEIGHT / 2 }];
}

// "🕰️ 과거 - 설명" 형태에서 앞의 라벨을 떼고 설명만 남김 (라벨은 따로 크게 보여줌)
export function stripGuidanceLabel(guidance: string): string {
  const parts = guidance.split(' - ');
  return parts.length > 1 ? parts.slice(1).join(' - ') : guidance;
}
