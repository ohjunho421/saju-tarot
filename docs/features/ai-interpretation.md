---
feature: AI 해석
status: active
last_modified: 2026-11-14
files:
  - server/src/services/ai.service.ts
  - server/src/data/day-master-traits.ts
  - server/src/services/interpretation.service.ts
  - server/src/controllers/ai-interpretation.controller.ts
  - server/src/routes/ai-interpretation.routes.ts
  - server/src/controllers/interpretation.controller.ts
  - server/src/routes/interpretation.routes.ts
  - client/src/components/IntegratedResult.tsx
  - client/src/pages/ReadingPage.tsx
  - client/src/components/TarotReading.tsx
  - client/src/services/api.ts
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
- `/api/ai/ai-reading`: 질문은 문자열 1~200자(화면 입력창 maxLength와 동일), 사용자별 10분 10회(메모리 기반, 서버 재시작 시 초기화). 입력 검증을 통과한 요청만 횟수에 센다. 한도를 바꾸면 컨트롤러의 429 안내 문구도 함께 바꿀 것.
- 화면은 서버가 4xx로 거절한 리딩(ReadingRejectedError)이면 화면 꺼짐 복구를 건너뛰고 서버 안내를 바로 보여준다. 5xx·네트워크 오류는 기존대로 복구를 시도한다.

## 쉽게 보기 (easyReading, 2026-10-10~)

- Step 2 응답 JSON에 easyReading { headline, signal: go|wait|caution, cards[{ position, cardName, oneLine, forMe, action, tone: good|neutral|caution }] } 포함. cards 순서 = drawnCards 순서(메인 → 조언 카드).
- normalizeEasyReading(): 문자열만 허용, tone/signal 화이트리스트, 자리·카드명은 AI 출력이 아닌 실제 drawnCards 값으로 고정, 대시 기호 제거. 내용이 비면 undefined.
- Reading.easyReading(Json?) 컬럼에 저장, /ai/readings/:id(화면 꺼짐 복구)에서 반환.
- 클라이언트 EasyReadingView: 신호 + 한 줄 결론, 카드 흐름 도식(three-card/six-months/problem-solution은 화살표, two-card는 VS), 카드별 3단계(이 카드는 → 나에게는 → 오늘 해볼 것). easyReading이 없는 기록은 카드 description·정/역 의미로 간이 표시.
- 문체: PLAIN_LANGUAGE_RULES(해요체, 결론 먼저, 용어 괄호 풀이, 일상 비유, AI 상투어·대시·이모지·뻔한 마무리 금지)를 리딩·챗봇 프롬프트에 공통 적용.

## 페르소나 리딩 흐름 (2026-11-14~)

- 리딩 흐름: 이 사람의 성향 → 그 성향 때문에 생긴 고민의 뿌리 → 카드가 하는 말 → 이 사람에게 맞는 행동. 오늘의 운세는 고민 대신 "이 성향에게 오늘 기운이 어떻게 작용하는지".
- `data/day-master-traits.ts`: 10천간별 상징·본성·강점·약점·고민이 생기기 쉬운 지점·와닿는 말 방식. 같은 화(火)라도 병화(태양)와 정화(촛불)를 구분한다. 데이터가 없으면 기존 오행 5개 설명으로 대체.
- Step 1(analyzeContext) 출력에 `persona`(일간·별자리·MBTI를 합친 모습), `worryRoot`(고민의 뿌리), `previousLink`(이어지는 이전 상담) 추가. 세 필드는 cleanSpreadText로 정리·길이 제한 후 Step 2에 들어간다. 이력이 없으면 previousLink는 강제로 빈 값. Step 1 실패 시 일간 성향으로 기본 페르소나를 만든다.
- 이전 리딩 재료(컨트롤러 toPreviousReading): 최근 3건(오늘의 운세 제외)의 질문, 그때 카드, easyReading.headline, 요약(`===CARD_DETAILS===` 앞 300자). Step 1·Step 2·레거시 프롬프트 모두에 들어간다.
- 응답 JSON 필드·저장 컬럼은 변경 없음. 페르소나는 프롬프트 내부에서만 쓰고 화면에 노출하지 않는다.
- Step 1 응답·파싱 로그는 길이만 남긴다(본문에 고민·이전 질문이 담김).

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
| 2026-10-10 | 스프레드 추천: AI 추천값을 SPREAD_POSITIONS로 검증(표기 정규화, 목록 밖이면 규칙 기반), JSON은 첫 완결 객체만 추출, 프롬프트에 합격·재회·가까운 결정·선택지 수·연도 운세 규칙 추가. 규칙 기반 추천을 재회 → 궁합 → 시기 → 선택지 → 기간별 운세 → 원인 → 결정 → 예/아니오 순으로 재정리 | ai.service.ts | 추천 점검: AI 15/18 → 18/18, 새 질문 10/12, 규칙 기반 11/18 → 18/18 |
| 2026-10-11 | designCustomSpread(대화로 배치 설계, Gemini JSON 모드 → Claude, 실패 시 지금 배치 유지 또는 범용 배치) + POST /api/ai/design-spread(인증, 질문 5~200자·대화 10개·각 300자). 리딩 프롬프트에 "[맞춤 배치] 자리: 뜻" 블록 추가. 추천은 custom을 돌려주지 않음 | ai.service.ts, ai-interpretation.controller.ts, ai-interpretation.routes.ts, tarot.model.ts, tarot.service.ts, utils/custom-spread.ts | 맞춤 배치 기능 |
| 2026-11-14 | 페르소나 리딩: 10천간 성향 데이터 신규, Step 1에 persona·worryRoot·previousLink 추가(출력 한도 2048→3072), Step 2·레거시 흐름을 성향→고민의 뿌리→카드→행동으로, 카드별 "성향에 비춘 의미" 단계 추가(카드당 350~450자), 이전 리딩 재료를 질문+카드+headline+요약으로 보강하고 오늘의 운세 기록 제외, 오늘의 운세의 이전 상담 강제 연결 제거, 사주 재계산 조건에 zodiac 누락 추가, 프롬프트의 "서양 별자리(지미두수)" 표기 수정 | ai.service.ts, ai-interpretation.controller.ts, data/day-master-traits.ts(신규) | 일간 특성 기반 페르소나·고민 연결·이전 리딩 연계 요청 |
| 2026-11-14 | 리딩 API에 사용자별 호출 제한(10분 10회, 429)과 질문 검증(문자열 1~200자, 400) 추가. 화면은 4xx 거절 시 "연결이 끊어졌습니다" 대신 서버 안내를 바로 표시(기존엔 모든 실패가 3초 뒤 복구 경로로 감). 2차 보안 리뷰 반영: 프롬프트·카드 뽑기에는 cleanSpreadText로 정리한 질문을 쓰고(보이지 않는 문자만이면 400) DB에는 원문 저장(복구 시 질문 비교 유지), 맞춤 배치 확정 때 질문 칸이 비었으면 배치를 만든 질문 사용, 화면에서 보낼 때 200자로 자름(한글 조합 중 maxLength 초과 대비) | ai-interpretation.controller.ts, api.ts, ReadingPage.tsx, TarotReading.tsx | 보안 리뷰 MEDIUM(비용 남용) 후속 |
| 2026-11-14 | 보안 리뷰 반영: Step 1 응답·파싱·레거시 결론 로그를 길이만 남기도록 변경, 일간 조회에 typeof·hasOwnProperty 확인, 이전 리딩 재료와 Step 1 새 필드를 cleanSpreadText로 정리, 역방향 판정 `=== true` | ai.service.ts, ai-interpretation.controller.ts, data/day-master-traits.ts | 보안 리뷰(MEDIUM 1, LOW 3) |
| 2026-10-11 | 맞춤 배치 보안 리뷰 반영: 사용자별 호출 제한(10분 20회, 429), 서버에서 수정 5회 상한, 탈퇴 계정 확인, 이 기능은 Gemini flash만 사용(실패 유도로 pro까지 호출되는 비용 증폭 차단), 질문·대화의 줄바꿈·따옴표 정리, 자리 이름의 보이지 않는 유니코드 문자 제거 | ai-interpretation.controller.ts, ai.service.ts, utils/custom-spread.ts, utils/user-rate-limit.ts(신규), api.ts, CustomSpreadBuilder.tsx | 보안 리뷰(MEDIUM 1, LOW 3) |
