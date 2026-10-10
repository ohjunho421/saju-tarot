---
feature: 띠/별자리 운세
status: active
last_modified: 2026-05-25
files:
  - server/src/services/zodiac.service.ts
tags: [띠, 운세, 별자리, 궁합, 서양점성술]
---

# 띠/별자리 운세

## 설명

생년월일 기반으로 서양 12별자리(Zodiac) 정보를 제공하는 기능.
각 별자리의 성격, 장단점, 궁합 정보를 포함하며, 사주 분석과 연동된다.

## 핵심 로직

- `ZodiacService` — 별자리 판별 및 정보 반환
- `ZODIAC_DATA` — 12별자리 전체 데이터 상수 (Record<ZodiacSign, ZodiacInfo>)
- `ZodiacInfo` 인터페이스: `sign`, `symbol`, `element`(서양 4원소: 불/흙/바람/물), `quality`(활동궁/고정궁/변통궁), `rulingPlanet`, `personality`, `strengths[]`, `weaknesses[]`, `compatibility[]`
- `saju.service.ts`에서 import하여 사주 분석 결과에 별자리 정보를 통합

## 주의사항

- 서양 4원소(불/흙/바람/물)와 동양 오행(목/화/토/금/수)은 별개 체계 — 혼동 주의
- 별자리 날짜 범위는 전통 기준 (천문학적 변동 미반영)
- `compatibility` 배열은 궁합 좋은 별자리 목록 — 데이터 변경 시 양방향 일관성 확인

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
