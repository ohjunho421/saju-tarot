import type { Element } from '../types';

// 오행을 생활 비유로 풀어 쓴 설명 (사주 결과 "한눈에 보는 나"에서 사용)
export interface ElementPlain {
  name: string;      // 나무, 불 ...
  hanja: string;
  textClass: string;
  person: string;    // "OO 같은 사람" 설명
  strength: string;  // 많을 때 내 무기
  fillTip: string;   // 부족할 때 생활 팁 (서버 saju.service 추천과 같은 방향)
}

export const ELEMENT_PLAIN: Record<Element, ElementPlain> = {
  '목': {
    name: '나무',
    hanja: '木',
    textClass: 'text-green-400',
    person: '나무처럼 쑥쑥 자라려는 사람이에요. 새로 시작하는 걸 좋아하고 생각이 유연해요.',
    strength: '새로 시작하는 힘, 아이디어',
    fillTip: '새 취미를 하나 시작하거나, 머릿속 아이디어를 메모로 적어 보세요.'
  },
  '화': {
    name: '불',
    hanja: '火',
    textClass: 'text-red-400',
    person: '불처럼 밝고 뜨거운 사람이에요. 표현을 잘하고 사람들과 어울리는 걸 즐겨요.',
    strength: '열정, 표현력',
    fillTip: '고마운 사람에게 마음을 말로 전해 보거나, 햇볕 쬐며 걸어 보세요.'
  },
  '토': {
    name: '흙',
    hanja: '土',
    textClass: 'text-yellow-400',
    person: '흙처럼 든든한 사람이에요. 책임감이 강하고 현실적으로 판단해요.',
    strength: '꾸준함, 책임감',
    fillTip: '자는 시간과 밥 먹는 시간을 일정하게 맞춰 생활 리듬부터 잡아 보세요.'
  },
  '금': {
    name: '쇠',
    hanja: '金',
    textClass: 'text-gray-300',
    person: '쇠처럼 단단하고 분명한 사람이에요. 원칙을 지키고 논리적으로 판단해요.',
    strength: '결단력, 정리하는 힘',
    fillTip: '할 일 목록을 만들고 하나씩 끝내는 연습을 해 보세요.'
  },
  '수': {
    name: '물',
    hanja: '水',
    textClass: 'text-blue-400',
    person: '물처럼 깊고 유연한 사람이에요. 생각이 깊고 상황에 맞춰 모양을 바꿀 줄 알아요.',
    strength: '생각의 깊이, 적응력',
    fillTip: '하루 10분 혼자 생각을 정리하거나 짧게 일기를 써 보세요.'
  }
};
