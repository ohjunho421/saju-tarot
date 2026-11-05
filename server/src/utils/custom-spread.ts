import type { CustomPosition } from '../models/tarot.model';

export const CUSTOM_SPREAD_MIN = 2;
export const CUSTOM_SPREAD_MAX = 7;
const LABEL_MAX = 10;
const MEANING_MAX = 60;
const ADVICE_LABEL = '조언 카드'; // 별도 조언 카드 표시와 겹치면 안 되는 이름

// 사용자 입력이나 AI 출력에서 온 문자열을 프롬프트·화면에 넣어도 안전한 짧은 텍스트로 정리
export function cleanSpreadText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value
    // 제어·서식 문자(폭 없는 문자, 글자 방향 뒤집기 등)와 한글 채움 문자는 보이지 않게 이름을 흉내 낼 수 있어 제거
    .replace(/[\p{Cc}\p{Cf}ᅟᅠㅤﾠ]/gu, ' ')
    .replace(/["\\`]/g, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

// 맞춤 배치 자리 검증: 2~7개, 이름 중복 제거, 길이 제한. 조건을 못 맞추면 null
export function sanitizeCustomPositions(raw: unknown): CustomPosition[] | null {
  if (!Array.isArray(raw)) return null;

  const seen = new Set<string>();
  const positions: CustomPosition[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const source = item as Record<string, unknown>;
    let label = cleanSpreadText(source.label, LABEL_MAX);
    if (label === ADVICE_LABEL) label = '조언';
    if (!label || seen.has(label)) continue;
    seen.add(label);
    positions.push({ label, meaning: cleanSpreadText(source.meaning, MEANING_MAX) });
    if (positions.length === CUSTOM_SPREAD_MAX) break;
  }

  return positions.length >= CUSTOM_SPREAD_MIN ? positions : null;
}
