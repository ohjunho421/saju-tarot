---
feature: 포인트 시스템
status: active
last_modified: 2026-11-17
files:
  - server/prisma/schema.prisma
  - server/src/services/pricing.ts
  - server/src/services/point.service.ts
  - server/src/controllers/point.controller.ts
  - server/src/routes/point.routes.ts
  - server/src/controllers/ai-interpretation.controller.ts
  - server/src/controllers/auth.controller.ts
  - client/src/stores/points.ts
  - client/src/components/PointsCard.tsx
  - client/src/components/TarotReading.tsx
  - client/src/pages/ReadingPage.tsx
  - client/src/pages/PolicyPage.tsx
tags: [포인트, 결제, 충전, 사용, 잔액, 가격, 요금, 무료]
---

# 포인트 시스템

## 설명

리딩 요금을 포인트로 받는다. 1포인트 = 1원. 충전(결제)은 [payment.md](./payment.md) 참고.

원래는 로그인만 하면 모든 리딩이 무료였다. 아래 가격표는 **유료 전환 스위치(`PAID_MODE=on`)를 켠 뒤부터** 적용된다. 스위치가 꺼져 있으면 전처럼 무료이고 잔액·요금 표시도 숨겨진다 — [payment.md](./payment.md)의 "유료 전환 스위치" 참고.

## 가격표 — 기준은 `server/src/services/pricing.ts` 한 곳

| 리딩 | 요금 |
|------|------|
| 원 카드, 예/아니오, 오늘의 운세 | 스프레드별 하루 1회 무료, 같은 날 다시 보면 490P |
| 투 카드, 쓰리 카드, 문제와 해결 | 990P |
| 켈트 십자가, 사주 맞춤형, 6개월 흐름, 맞춤 배치 | 2,900P |
| 궁합 리딩, 상대 정보를 넣은 모든 리딩 | 3,900P |
| 사주 분석, 조언 카드 추가, 리딩 뒤 챗봇 | 무료 |

- 가입 시 1,000P 지급(`SIGNUP_BONUS_POINTS`). 유료 전환 시점의 기존 회원에게는 마이그레이션이 1,000P를 한 번 지급했다.
- 충전 단위: 3,000 / 5,000 / 10,000원 (결제 금액 = 지급 포인트).
- **가격을 바꿀 때**: `pricing.ts`만 고치면 화면(스프레드 카드, 요금 안내 페이지, 충전 창)은 `GET /api/points/prices`로 받아 따라온다. 이 문서의 표도 같이 고친다.
- 하루 기준은 한국 시간 날짜(`todayKst`).

## 핵심 로직

- `User.points` — 현재 잔액. `PointTransaction` — 거래 내역(`charge` | `use` | `refund`, `amount`는 충전 양수·사용 음수, `balance`는 거래 후 잔액).
- 잔액 변경은 전부 `point.service.ts`를 거친다. 잔액 변경과 내역 기록을 한 DB 트랜잭션으로 묶는다.
- **차감** `spendPoints`: `points >= cost` 조건의 단일 UPDATE. 동시에 두 번 요청해도 잔액이 음수가 되지 않는다. 모자라면 `InsufficientPointsError` → 리딩 API가 402(`code: INSUFFICIENT_POINTS`, `required`, `balance`).
- **하루 1회 무료** `claimDailyFree`: `DailyFreeUse(userId, spreadType, day)` 유니크 행을 먼저 만든다. 만들어지면 무료, 이미 있으면 490P. 같은 요청을 동시에 여러 개 보내도 하나만 무료가 된다.
- **리딩 API** (`getAIIntegratedReading`): 입력 검증 → 무료 차지 또는 요금 차감 → AI 호출 → 리딩 저장. AI 호출·저장이 실패하면 catch에서 `refundSpend`로 포인트를, `releaseDailyFree`로 무료를 되돌린다. 리딩이 저장된 뒤에는 되돌리지 않는다.
- **궁합**: 상대 생년월일로 사주를 계산하지 못하면 리딩을 만들지 않고 400 + 환불한다(궁합 요금을 받고 일반 리딩을 내보내지 않는다).
- **API**: `GET /api/points/prices`(공개), `GET /api/points/me`(잔액 + 오늘 무료를 쓴 스프레드), `GET /api/points/history`(최근 50건). `/auth/me`·로그인·가입 응답에도 `points`가 들어간다.
- **화면**: 헤더 잔액 버튼(누르면 충전 창), 스프레드 카드의 요금 표시, 마이페이지 포인트 카드, 하단 "요금과 환불 안내".
  카드를 고르기 전에 `ReadingPage.handleTarotComplete`가 잔액을 먼저 확인해 모자라면 충전 창을 연다(최종 판단은 서버).

## 주의사항

- 화면의 요금 계산(`client/src/stores/points.ts` `readingPrice`)은 안내용이다. 서버 `getReadingPrice`와 규칙이 같아야 하므로 한쪽을 바꾸면 다른 쪽도 바꾼다.
- 새 스프레드를 `SPREAD_POSITIONS`에 추가하면 `pricing.ts`의 `SPREAD_PRICES`나 무료 목록에도 넣는다. 빠뜨리면 990P로 처리된다(무료로 새지 않게 하는 안전값).
- 하루 1회 무료 기록은 리딩 기록(`Reading`)과 따로 둔다. 리딩 기록을 지워도 무료가 다시 열리지 않는다.
- `User.points`에는 0 이상 CHECK 제약이 있다. 잔액을 직접 빼는 코드를 새로 만들면 제약 위반으로 실패할 수 있으니 `point.service.ts`를 거친다.
- 가입 보너스는 계정마다 지급된다. 같은 IP의 가입은 1시간에 5번으로 제한하지만(메모리 기반), **이메일 인증이 없어 계정을 여러 개 만드는 것 자체는 막지 못한다.** 남용이 보이면 이메일 인증 뒤 지급으로 바꿀 것.
- `onDelete: Cascade` — 사용자 삭제 시 거래 내역·주문도 함께 삭제된다.
- 환불 정책 문구는 `client/src/pages/PolicyPage.tsx`, 사업자 정보는 `client/src/data/business.ts`(비어 있으면 화면에 안 나온다 — 실결제 전 채울 것).

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
| 2026-11-16 | 리딩 유료화: 가격표, 차감·환불, 가입 보너스, 잔액·내역 API, 헤더 잔액·요금 표시·마이페이지 포인트 카드·요금 안내 페이지 | 위 files 전체 | 수익화 — 신년운세 성수기 전 결제 도입 |
| 2026-11-16 | 무료 리딩을 유니크 행 선점으로 판정, 궁합 계산 실패 시 환불, 가입 IP 제한, 잔액 0 이상 제약 | `point.service.ts`, `ai-interpretation.controller.ts`, `auth.controller.ts`, 마이그레이션 | 보안 리뷰: 동시 요청으로 무료 리딩 반복, 가입 보너스 남용 |
