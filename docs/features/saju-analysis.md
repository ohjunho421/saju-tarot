---
feature: 사주 분석
status: active
last_modified: 2026-10-10
files:
  - server/src/services/saju.service.ts
  - server/src/models/saju.model.ts
  - server/src/controllers/saju.controller.ts
  - server/src/routes/saju.routes.ts
  - client/src/components/SajuResult.tsx
  - client/src/components/BirthInfoForm.tsx
  - client/src/components/EasySajuView.tsx
  - client/src/data/salDetails.ts
  - client/src/data/elementPlain.ts
  - client/src/components/ElementGuide.tsx
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

## 화면 문구 (2026-10-10~)

- SajuResult 맨 위 "한눈에 보는 나"(EasySajuView): 일간 오행 비유, 많은 기운(내 무기)·부족한 기운(생활 팁), 신살 요약. 저장된 데이터로만 계산, AI 호출 없음.
- 부족한 기운 생활 팁(data/elementPlain.ts)은 서버 analyzePersonality의 추천(창의 활동·정서 표현·안정감·체계적 사고·명상)과 같은 방향을 유지.
- 신살 설명(data/salDetails.ts)은 Record<SalType>이라 타입에 신살을 추가하면 설명도 반드시 추가해야 빌드된다.

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
| 2026-10-10 | 사주 결과 화면 쉬운 말 적용: 한눈에 보는 나 추가, 사주 표·오행 라벨 설명, 신살 23개 설명을 용어 없이 재작성(데이터 파일 분리), 길신/흉살 → 도움/조심 배지, 별자리 제목의 부정확한 "(지미두수)" 제거, "목 (木火土金水)" 표기 수정 | SajuResult.tsx, EasySajuView.tsx(신규), data/salDetails.ts(신규), data/elementPlain.ts(신규), ElementGuide.tsx | 사용자 요청(humanizer·eli5 적용) |
