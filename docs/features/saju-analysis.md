---
feature: 사주 분석
status: active
last_modified: 2026-05-25
files:
  - server/src/services/saju.service.ts
  - server/src/models/saju.model.ts
  - server/src/controllers/saju.controller.ts
  - server/src/routes/saju.routes.ts
  - client/src/components/SajuResult.tsx
  - client/src/components/BirthInfoForm.tsx
tags: [사주, 팔자, 오행, 음양, 천간, 지지, 일간]
---

# 사주 분석

## 설명

생년월일시를 기반으로 사주팔자(四柱八字)를 계산하고 오행 균형, 성격, 살(煞) 등을 분석하는 핵심 기능.
`lunar-javascript` 라이브러리로 양력→음력 변환 후 천간·지지를 산출한다.

## 핵심 로직

- `SajuService.analyzeSaju(birthInfo)` — 메인 분석 진입점. 회원가입 시에도 호출되어 `User.sajuAnalysis`에 저장
- `parseGanZhi(ganZhi)` — 한자 간지(甲子 등)를 한글(갑·자)로 매핑 (60갑자 전체 포함)
- `calculateElementBalance(chart)` — 천간(가중치 2) + 지지(가중치 1)로 오행 비율 계산
- `analyzePersonality(dayMasterElement, balance)` — 일간 오행 기준 성격·장단점·추천 도출
- `analyzeSal(chart)` — 도화살, 역마살 등 살(煞) 판별 (삼합 기준)
- `SajuPillar` 모델: `{ heavenlyStem, earthlyBranch, element }`

## 주의사항

- 간지 매핑 테이블(60갑자)은 하드코딩이며 순서가 중요 — 수정 시 전체 일관성 확인 필수
- `lunar-javascript`는 CommonJS(`require`)로 import — ESM 전환 시 주의
- 회원가입 시 `auth.controller.ts`에서 `sajuService.analyzeSaju()`를 호출해 결과를 DB에 저장
- 오행 가중치(천간 2, 지지 1)는 전통 사주 해석 기준 — 임의 변경 금지

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
