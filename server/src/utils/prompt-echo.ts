// AI가 JSON 양식의 값 자리에 적어 둔 작성 지침을 내용 대신 그대로 돌려줄 때가 있다.
// 예: "cardReadings": "오늘의 운세를 총운/금전운/연애운 순서로 해석합니다. ... 각 운세별 400~500자."
// 실제 리딩 글에는 나오지 않는 지침 표현(분량 지시, 줄바꿈 지시, 순서 지시)이 있으면 지침이 섞인 것으로 본다.
const INSTRUCTION_PATTERNS: readonly RegExp[] = [
  /\d{1,4}\s*~\s*\d{1,4}\s*자/, // 400~500자, 300~350자
  /\(\s*\d{1,4}\s*자(\s*(안팎|이내))?\s*\)/, // (300자), (30자 안팎)
  /\d{1,4}\s*자\s*(안팎|이내)/, // 20자 이내의 쉬운 말
  /(카드|운세)\s*(당|별)\s*\d{2,4}/, // 카드당 300~400자, 각 운세별 400~500자
  /줄바꿈\s*\((\s|\\n)*\)/, // 줄바꿈(\n\n) — 파싱 뒤에는 괄호 안이 실제 줄바꿈이 된다
  /순서로 해석합니다|각 운에 대해\s*:|각 카드를 해석하되|반드시 이 순서를 따르세요/,
  /\[작성 지침\]/,
];

export const containsEchoedInstruction = (text: string): boolean =>
  INSTRUCTION_PATTERNS.some((pattern) => pattern.test(text));

// 필드 이름 → 글. 지침이 섞인 필드 이름만 돌려준다
export const findEchoedInstructionFields = (fields: Record<string, string | undefined>): string[] =>
  Object.entries(fields)
    .filter(([, text]) => typeof text === 'string' && text.length > 0 && containsEchoedInstruction(text))
    .map(([name]) => name);
