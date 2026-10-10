---
feature: AI 해석
status: active
last_modified: 2026-10-10
files:
  - server/src/services/ai.service.ts
  - server/src/services/interpretation.service.ts
  - server/src/controllers/ai-interpretation.controller.ts
  - server/src/routes/ai-interpretation.routes.ts
  - server/src/controllers/interpretation.controller.ts
  - server/src/routes/interpretation.routes.ts
  - client/src/components/IntegratedResult.tsx
  - client/src/components/EasyReadingView.tsx
  - server/prisma/migrations/20261010000000_add_easy_reading/migration.sql
tags: [AI, Gemini, Claude, 해석, 스프레드, 프롬프트]
---

# AI 해석

## 설명

Gemini(primary)와 Claude(fallback) 두 AI를 사용해 타로 카드를 해석하는 기능.
사주 분석 결과와 타로 카드를 통합하여 개인화된 해석을 생성한다.

## 핵심 로직

- `AIService` 생성자 — Gemini/Claude API 키 존재 여부로 초기화 (둘 다 없으면 경고)
- `analyzeQuestionAndRecommendSpread(question)` — 질문 분석 후 최적 스프레드 추천 (시기→six-months, 비교→two-card 등)
- `InterpretationService.integrateInterpretation()` — 사주 오행 + 타로 카드 오행 연결 분석
- `analyzeElementalConnection()` — 일간 오행과 카드 오행의 상생상극 분석
- Gemini 모델: `gemini-2.5-flash` (primary), `gemini-2.5-pro` (fallback)
- Claude: `CLAUDE_API_KEY` 또는 `ANTHROPIC_API_KEY` 환경변수 지원

## 주의사항

- AI 호출 실패 시 다른 프로바이더로 fallback — 두 곳 다 실패하면 에러 반환
- 프롬프트에 "타로 마스터" 페르소나 설정 — 톤 변경 시 전체 프롬프트 검토 필요
- `ELEMENT_RELATIONS` 상수로 오행 상생상극 관계 정의 — interpretation.service.ts에서 사용
- API 키는 환경변수로만 관리 — 코드에 하드코딩 금지
- Gemini 2.5는 thinking 토큰이 maxOutputTokens 안에서 먼저 소비된다. tryGeminiWithFallback의 maxTokens는 "보이는 답" 분량이고, thinking 예산(기본 1024, 본 해석 4096)을 명시해 한도에 더한다. 작은 한도로 호출할 때 예산 없이 부르면 MAX_TOKENS로 잘린다.
- 스프레드 추천·챗봇은 Claude 우선이지만, Claude 호출이 실패(키 오류 등)하면 Gemini로 넘어간다.

## 쉽게 보기 (easyReading, 2026-10-10~)

- Step 2 응답 JSON에 easyReading { headline, signal: go|wait|caution, cards[{ position, cardName, oneLine, forMe, action, tone: good|neutral|caution }] } 포함. cards 순서 = drawnCards 순서(메인 → 조언 카드).
- normalizeEasyReading(): 문자열만 허용, tone/signal 화이트리스트, 자리·카드명은 AI 출력이 아닌 실제 drawnCards 값으로 고정, 대시 기호 제거. 내용이 비면 undefined.
- Reading.easyReading(Json?) 컬럼에 저장, /ai/readings/:id(화면 꺼짐 복구)에서 반환.
- 클라이언트 EasyReadingView: 신호 + 한 줄 결론, 카드 흐름 도식(three-card/six-months/problem-solution은 화살표, two-card는 VS), 카드별 3단계(이 카드는 → 나에게는 → 오늘 해볼 것). easyReading이 없는 기록은 카드 description·정/역 의미로 간이 표시.
- 문체: PLAIN_LANGUAGE_RULES(해요체, 결론 먼저, 용어 괄호 풀이, 일상 비유, AI 상투어·대시·이모지·뻔한 마무리 금지)를 리딩·챗봇 프롬프트에 공통 적용.

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
| 2026-10-10 | 쉬운 말 규칙(PLAIN_LANGUAGE_RULES) 추가, 카드 해석 순서를 결론 먼저로 변경, easyReading 구조화 필드 생성·검증·저장, 챗봇 프롬프트에도 규칙 적용 | ai.service.ts, tarot.model.ts, ai-interpretation.controller.ts, schema.prisma, migration | 리딩이 어렵다는 피드백 |
| 2026-10-10 | 결과 화면에 쉽게 보기 추가, 긴 상세 해석은 기본 접힘 | EasyReadingView.tsx(신규), IntegratedResult.tsx, types/index.ts | 리딩이 어렵다는 피드백 |
| 2026-10-10 | 잘못된 spreadType 요청을 500 대신 400으로 거절 | ai-interpretation.controller.ts | 리뷰 |
| 2026-10-10 | Step 1 컨텍스트 분석이 매번 실패하던 문제 수정: Gemini 2.5 thinking이 한도 2048을 다 써서 flash는 JSON이 잘리고 pro는 빈 응답 → thinking 예산을 명시하고 출력 한도에 더함. 실패 사유(MAX_TOKENS 등)를 로그에 남기고, 오해를 부르던 "할당량 소진" 메시지 수정 | ai.service.ts | 1단계 분석이 규칙 기반 fallback으로만 동작, 리딩당 약 30초 낭비 |
| 2026-10-10 | 스프레드 추천·챗봇에서 Claude 호출 실패 시 Gemini로 넘어가도록 수정(기존엔 Claude 키가 설정만 돼 있으면 실패해도 Gemini를 시도하지 않음) | ai.service.ts | 문서상 fallback 동작과 불일치, 키 오류 시 챗봇 전면 불가 |
| 2026-10-10 | 원격 PR #2(궁합 강화: buildCompatibilityFacts, 일지·띠 궁합)와 이번 변경 병합. generateReading 프롬프트 직전에서 충돌, 두 블록 모두 유지 | ai.service.ts | 로컬 main이 원격보다 2커밋 뒤처짐 |
| 2026-10-10 | Step 2·레거시 응답에서 첫 번째 완결 JSON만 추출(extractFirstJsonObject). 기존 "첫 { ~ 마지막 }" 정규식은 JSON 뒤에 내용이 붙으면 파싱 실패 → 궁합 리딩 5회 중 1회 레거시로 떨어져 쉽게 보기·궁합 분석이 비었음 | ai.service.ts | 배포 전 검증 중 발견 |
