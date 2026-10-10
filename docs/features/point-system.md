---
feature: 포인트 시스템
status: active
last_modified: 2026-05-25
files:
  - server/prisma/schema.prisma
tags: [포인트, 결제, 충전, 사용, 잔액]
---

# 포인트 시스템

## 설명

사용자별 포인트 충전·사용·환불을 관리하는 시스템. Prisma 스키마에 `PointTransaction` 모델로 정의.
1포인트 = 1원 기준.

## 핵심 로직

- `User.points` — 현재 보유 포인트 (default: 0)
- `PointTransaction` 모델 — 거래 내역 기록
  - `type`: `charge` | `use` | `refund`
  - `amount`: 변동량 (양수=충전, 음수=사용)
  - `balance`: 거래 후 잔액
  - `orderId?`: 외부 결제 주문 ID (충전 시)
  - `readingId?`: 사용된 리딩 ID (사용 시)
- 인덱스: `[userId, createdAt]`, `[orderId]`

## 주의사항

- 현재 포인트 차감/충전 API 엔드포인트는 별도로 구현되어 있지 않을 수 있음 — 스키마만 정의된 상태
- `onDelete: Cascade` — 사용자 삭제 시 거래 내역도 함께 삭제
- 포인트 잔액 정합성: `balance` 필드는 거래 시점의 스냅샷 — `User.points`와 불일치 가능성 있음
- 결제 연동(레몬스퀴지 등)은 `orderId`로 추적

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
