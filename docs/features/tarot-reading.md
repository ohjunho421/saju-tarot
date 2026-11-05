---
feature: 타로 리딩
status: active
last_modified: 2026-11-04
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
  - client/src/components/CustomSpreadBuilder.tsx
  - server/src/utils/custom-spread.ts
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

## 맞춤 배치 (2026-10-11~)

- spreadType 'custom' + customPositions[{label, meaning}] (2~7개). 자리는 DB에 drawnCards.positionMeaning으로만 저장된다.
- 서버가 생성·리딩 요청 양쪽에서 utils/custom-spread.ts의 sanitizeCustomPositions로 다시 검증한다(길이·중복·"조언 카드" 이름 치환).
- 고정 스프레드 10종과 자동 추천은 그대로이며, 맞춤 배치는 선택 옵션이다.

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
| 2026-10-10 | 카드 선택 화면을 한 화면 구조로 재구성(슬롯 줄·미리보기 뽑기 버튼·공개 보드), 6개월 스프레드 3x2 배치 | CardSelection.tsx, cardSelectionConfig.ts(신규) | 뽑을 때마다 위아래 스크롤 왕복 |
| 2026-10-10 | 버그 수정: 데스크톱 휠이 덱 로딩 전 값에 묶여 한 위치로 튐, 켈트 십자가 위쪽 카드 잘림, 조언 카드가 켈트/궁합 카드와 겹침, 켈트 안내 문구(먼 과거/최근 과거)와 서버 자리(무의식적 영향/과거) 불일치 | CardSelection.tsx, cardSelectionConfig.ts | 리뷰 |
| 2026-10-10 | 카드 선택 중 상단 3단계 진행 표시가 2단계 미완료로 보이던 문제 수정 | ReadingPage.tsx | 리뷰 |
| 2026-10-10 | 스프레드 선택 화면: 질문에 "운세·금전운·연애운"이 있으면 AI 추천과 사용자 선택을 무시하고 오늘의 운세로 바꾸던 로직 제거(빈 질문만 오늘의 운세). 목록에 없던 예/아니오·투 카드·문제와 해결 추가(AI 추천 시 이름 빈칸 해결). 직접 고르지 않으면 제출 시 AI 추천을 자동 적용 | TarotReading.tsx | 스프레드 추천 점검: 최종 적합 12/18 → 18/18 |
| 2026-10-11 | 대화로 만드는 맞춤 배치 추가: 스프레드 선택 화면의 "AI와 대화로 맞춤 배치 만들기" → 2~7자리 제안·수정(최대 5턴) → 확정 시 바로 카드 선택. 카드 선택은 맞춤 자리 이름·뜻·장수를 사용하고 보드는 장수에 맞춰 자동 배치(4장까지 한 줄) | CustomSpreadBuilder.tsx(신규), TarotReading.tsx, CardSelection.tsx, cardSelectionConfig.ts, ReadingPage.tsx, HistoryPage.tsx, api.ts, types/index.ts | 고정 스프레드로 담기 어려운 질문(3지선다 등) |
| 2026-11-04 | 카드 이미지 78장을 새 일러스트(고양이 덱, 768×1376)로 교체. 파일명 동일해 매핑 변경 없음 | server/public/tarot-images/*.jpg | 사용자 요청 |
| 2026-11-04 | 카드 앞면 틀을 새 그림 비율(24:43)에 맞춤: 보드 기준 카드 80x120 → 67x120(높이 고정이라 배치 좌표 그대로), 쉽게 보기 썸네일 aspect-[2/3] → aspect-[24/43]. 부채꼴 덱·슬롯 줄(뒷면만 표시)은 그대로 | cardSelectionConfig.ts, EasyReadingView.tsx | 2:3 틀에서 그림 아래 카드 이름이 잘림 |
