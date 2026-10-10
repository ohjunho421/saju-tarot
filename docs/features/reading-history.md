---
feature: 리딩 히스토리
status: active
last_modified: 2026-10-10
files:
  - server/src/controllers/reading.controller.ts
  - server/src/routes/reading.routes.ts
  - client/src/pages/HistoryPage.tsx
  - client/src/components/EasyReadingView.tsx
tags: [히스토리, 기록, 리딩, 저장, 삭제, 컨텍스트]
---

# 리딩 히스토리

## 설명

사용자의 타로 리딩 결과를 저장·조회·삭제하는 기능. 모든 엔드포인트에 인증 필수.
최근 리딩 컨텍스트 조회 기능으로 AI 해석의 연속성을 지원한다.

## 핵심 로직

- `POST /readings` — 리딩 결과 저장 (질문, 스프레드 타입, 뽑힌 카드, 해석 등)
- `GET /readings` — 사용자의 리딩 내역 목록 조회 (최신순)
- `GET /readings/context` — AI 해석용 최근 리딩 컨텍스트 조회
- `GET /readings/:id` — 특정 리딩 상세 조회
- `DELETE /readings/:id` — 리딩 삭제
- `router.use(authMiddleware)` — 모든 reading 라우트에 인증 미들웨어 적용

## 주의사항

- Reading 모델: `drawnCards`(Json), `interpretation`, `elementalHarmony`, `personalizedAdvice`, `adviceCardInterpretation?`, `compatibilityReading?`
- `userId + createdAt` 복합 인덱스 — 사용자별 시간순 조회 최적화
- 삭제는 soft delete가 아닌 hard delete — 복구 불가
- `aiProvider` 필드로 어떤 AI가 해석했는지 기록 (`gemini` | `claude`)

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
| 2026-10-10 | 해석에 내부 구분자 ===CARD_DETAILS===가 그대로 보이던 문제 수정(요약/상세 분리), 스프레드 라벨 누락(6개월·오늘의 운세 등) 수정, 펼치면 쉽게 보기 표시, localStorage 기록에 easyReading 저장 | HistoryPage.tsx, IntegratedResult.tsx | 리뷰 |
