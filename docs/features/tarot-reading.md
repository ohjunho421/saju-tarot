---
feature: 타로 리딩
status: active
last_modified: 2026-10-10
files:
  - server/src/services/tarot.service.ts
  - server/src/models/tarot.model.ts
  - server/src/data/tarot-cards.ts
  - server/src/utils/tarot-image-mapper.ts
  - server/src/controllers/tarot.controller.ts
  - server/src/routes/tarot.routes.ts
  - client/src/components/TarotReading.tsx
  - client/src/components/CardSelection.tsx
  - client/src/components/cardSelectionConfig.ts
  - client/src/pages/ReadingPage.tsx
tags: [타로, 카드, 스프레드, 리딩, 정방향, 역방향]
---

# 타로 리딩

## 설명

타로 카드 셔플·드로우·스프레드 배치를 처리하는 기능. 사용자가 카드를 직접 선택하거나 랜덤 드로우 가능.
다양한 스프레드 타입을 지원하며, AI 해석(`ai.service.ts`)과 연동된다.

## 핵심 로직

- `TarotService.drawCards(spreadType, question, includeAdviceCard, cardData)` — 카드 드로우 메인 함수
- 두 가지 입력 형식 지원: `number[]` (레거시) / `{ cardIndex, isReversed }[]` (신규)
- `shuffleDeck()` — Fisher-Yates 셔플 알고리즘
- `SPREAD_POSITIONS[spreadType]` — 스프레드별 포지션 의미 정의
- `getTarotCardImageUrl(name)` — 카드 이름 → 이미지 URL 매핑
- 스프레드 타입: `one-card`, `two-card`, `three-card`, `celtic-cross`, `saju-custom`, `yes-no`, `problem-solution`, `six-months`

## 주의사항

- `cardData`가 유효하지 않으면 fallback으로 랜덤 카드 사용 — 에러 로그 출력 후 정상 진행
- 역방향(isReversed) 확률은 30% (`Math.random() < 0.3`)
- `TAROT_CARDS` 데이터는 `tarot-cards.ts`에 하드코딩 — 카드 추가/삭제 시 인덱스 깨짐 주의
- `adviceCard` 옵션은 메인 스프레드 외 추가 조언 카드 1장 드로우

## 카드 선택 화면 구조 (2026-10-10~)

- 뽑는 단계: 상단 바(진행률 + 지금 뽑을 자리 + 안내) → 슬롯 줄(자리 수만큼, 뽑으면 채워짐) → 부채꼴. 한 화면 안에서 끝나도록 높이를 맞춤(모바일 375x812에서 켈트 십자가+조언 카드까지 스크롤 없음).
- 미리보기: 카드 한 번 탭 = 미리보기, 같은 카드 다시 탭 또는 "이 카드 뽑기" 버튼 = 선택.
- 공개 단계: 부채꼴을 숨기고 스프레드 보드 + 번호 범례 + "카드 해석 보기". 보드는 레이아웃 범위 중심 정렬, 컨테이너 폭·화면 높이에 맞춰 확대/축소. 조언 카드는 레이아웃 맨 아래 가운데.
- 자리 이름(POSITION_LABELS)과 안내 문구는 서버 SPREAD_POSITIONS와 일치해야 함. 서버 자리 이름을 바꾸면 cardSelectionConfig.ts도 같이 수정.

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
| 2026-10-10 | 카드 선택 화면을 한 화면 구조로 재구성(슬롯 줄·미리보기 뽑기 버튼·공개 보드), 6개월 스프레드 3x2 배치 | CardSelection.tsx, cardSelectionConfig.ts(신규) | 뽑을 때마다 위아래 스크롤 왕복 |
| 2026-10-10 | 버그 수정: 데스크톱 휠이 덱 로딩 전 값에 묶여 한 위치로 튐, 켈트 십자가 위쪽 카드 잘림, 조언 카드가 켈트/궁합 카드와 겹침, 켈트 안내 문구(먼 과거/최근 과거)와 서버 자리(무의식적 영향/과거) 불일치 | CardSelection.tsx, cardSelectionConfig.ts | 리뷰 |
| 2026-10-10 | 카드 선택 중 상단 3단계 진행 표시가 2단계 미완료로 보이던 문제 수정 | ReadingPage.tsx | 리뷰 |
