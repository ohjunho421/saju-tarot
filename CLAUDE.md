# 별사탕 (saju-tarot-service) 프로젝트 규칙

## 절대 규칙: 기존 기능 보존

**수정 시 기존 기능을 절대 삭제하거나 변경하지 않는다.**

- 사용자가 명시적으로 요청하지 않는 한, 기존 기능/로직/UI를 제거하지 않음
- 수정 전에 영향받는 기능 목록을 먼저 알려주고 확인받음
- 새 기능 추가 시에도 기존 기능이 깨지지 않는지 확인

## 프로젝트 구조

```
saju-tarot-service/
├── client/                    # React 프론트엔드
│   ├── src/
│   │   ├── components/        # UI 컴포넌트
│   │   │   ├── AuthModal.tsx
│   │   │   ├── BirthInfoForm.tsx
│   │   │   ├── CardSelection.tsx
│   │   │   ├── cardSelectionConfig.ts   # 스프레드별 자리 이름·안내·배치
│   │   │   ├── ChatBot.tsx
│   │   │   ├── EasyReadingView.tsx      # 결과 "쉽게 보기" 도식
│   │   │   ├── ElementGuide.tsx
│   │   │   ├── IntegratedResult.tsx
│   │   │   ├── SajuResult.tsx
│   │   │   └── TarotReading.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ReadingPage.tsx
│   │   │   ├── MyPage.tsx
│   │   │   └── HistoryPage.tsx
│   │   ├── services/api.ts
│   │   └── types/index.ts
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                    # Express 백엔드
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── ai.service.ts       # Gemini/Claude AI 연동
│   │   │   ├── saju.service.ts     # 사주 분석
│   │   │   ├── tarot.service.ts    # 타로 카드
│   │   │   ├── zodiac.service.ts   # 띠/운세
│   │   │   └── interpretation.service.ts
│   │   ├── routes/
│   │   ├── middleware/auth.middleware.ts
│   │   ├── utils/
│   │   └── data/tarot-cards.ts
│   ├── prisma/schema.prisma
│   └── Dockerfile
└── .env.example
```

## 스크립트

```bash
# 클라이언트
cd client && npm run dev      # Vite 개발 서버 (localhost:5173)
cd client && npm run build    # tsc + vite build

# 서버
cd server && npm run dev      # tsx watch (localhost:3001)
cd server && npm run build    # prisma generate + tsc + public 복사
cd server && npm start        # prisma migrate deploy + node dist/index.js
```

## 주요 기능 목록 (삭제 금지)

| 기능 | 핵심 파일 |
|------|-----------|
| 사주 분석 | `server/src/services/saju.service.ts`, `client/src/components/SajuResult.tsx` |
| 타로 리딩 (AI 해석) | `server/src/services/ai.service.ts`, `client/src/components/TarotReading.tsx` |
| 회원 인증 (JWT) | `server/src/routes/auth.routes.ts`, `client/src/components/AuthModal.tsx` |
| 리딩 히스토리 | `server/src/routes/reading.routes.ts`, `client/src/pages/HistoryPage.tsx` |
| 포인트 시스템 | `server/prisma/schema.prisma` (PointTransaction 모델) |
| 챗봇 | `server/src/controllers/chat.controller.ts`, `client/src/components/ChatBot.tsx` |

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프론트엔드 | React 19, TypeScript 5.9, Vite (rolldown), Tailwind CSS 3, shadcn/ui, Zustand, Framer Motion |
| 백엔드 | Express 4, TypeScript, Prisma (PostgreSQL) |
| AI | Google Gemini (gemini-2.5-flash/pro), Anthropic Claude |
| 인증 | JWT (jsonwebtoken), bcryptjs |
| 배포 | 클라이언트: Vercel / 서버: Railway (Docker) |

## 배포 환경

- **클라이언트**: Vercel (`saju-tarot.vercel.app`)
- **서버**: Railway (Docker, node:20-slim)
- **DB**: PostgreSQL (Railway 호스팅)
- **CORS**: 프로덕션에서 `*.vercel.app` 허용

## 보안 규칙

- 세션/토큰은 localStorage에 JWT 저장 (httpOnly 쿠키 마이그레이션 고려)
- 모든 사용자 데이터 API에 auth middleware 필수
- 비밀번호 bcryptjs 해시, API 키 응답에 포함 금지
- console.log로 민감 정보 출력 금지

## Gotchas (과거 교훈)

| 날짜 | 교훈 |
|------|------|
| 2026-05-21 | 프로젝트 하네스 초기 세팅. 이후 교훈 여기에 누적 |
| 2026-10-10 | 스프레드 자리 이름은 `server/src/models/tarot.model.ts`(SPREAD_POSITIONS)와 `client/src/components/cardSelectionConfig.ts`(POSITION_LABELS)에 둘 다 있다. 한쪽만 바꾸면 선택 안내와 AI 해석 자리가 어긋난다 |
| 2026-10-10 | `interpretation`은 `요약 ===CARD_DETAILS=== 상세` 형식. 화면에 쓰는 곳은 반드시 split |

## MANDATORY WORKFLOW — 모든 코드 수정에 적용

이 워크플로우는 선택이 아닌 필수다. 어떤 단계도 건너뛸 수 없다.

### STEP 1: 문서 읽기 (코드 수정 전)

코드를 건드리기 전에 반드시 아래를 순서대로 실행한다:

1. `docs/00-INDEX.md`를 Read한다
2. 요청 키워드로 매핑 테이블에서 관련 문서를 찾는다
3. 찾은 문서를 Read하여 기존 동작/의도/변경이력을 파악한다
4. 관련 문서가 없으면:
   - Grep/Explore로 코드를 탐색한다
   - 탐색 결과를 바탕으로 `docs/features/{기능명}.md`를 새로 생성한다
   - `docs/00-INDEX.md` 매핑 테이블에 행을 추가한다

**금지: 이 단계를 건너뛰고 바로 Edit/Write를 사용하는 행위**

### STEP 2: 요청 분석 → 스킬 선행 호출 (코드 작성 전)

| 요청 키워드 | 선행 호출 스킬 | 용도 |
|-------------|---------------|------|
| UI, 화면, 페이지, 컴포넌트, 디자인 | `frontend-design:frontend-design` | UI 설계 가이드 |
| React, 리액트, 훅, 상태관리 | `ccpp:react-patterns` | React 19 패턴 |
| Tailwind, 스타일, CSS | `ccpp:tailwind-design-system` | 디자인 시스템 |
| shadcn, 폼, 다이얼로그 | `ccpp:shadcn-ui` | shadcn/ui 컴포넌트 |
| 랜딩페이지, 프리미엄 UI | `ccpp:ui-ux-pro-max` | 빅테크 스타일 UI |
| API, 엔드포인트, REST | `ccpp:api-design-principles` | API 설계 원칙 |
| 로그인, 인증, JWT, 세션 | `everything-claude-code:security-review` | 보안 체크리스트 |
| DB, 스키마, 마이그레이션 | `everything-claude-code:database-migrations` | DB 마이그레이션 |
| 테스트, TDD | `ccpp:tdd` | TDD 워크플로우 |
| Docker, 배포 | `everything-claude-code:docker-patterns` | Docker 패턴 |
| TypeScript 타입, 제네릭 | `ccpp:typescript-advanced-types` | TS 고급 타입 |
| 라이브러리 사용법 | context7 MCP | 최신 문서 조회 |
| 리팩토링, 단순화 | `ccpp:simplify` | 코드 단순화 |
| 빌드 실패 | `ccpp:build-fix` | 빌드 에러 수정 |

> **복수 매칭 시**: 해당하는 스킬을 모두 호출한다.

**금지: 매칭되는 키워드가 있는데 스킬을 호출하지 않는 행위**

### STEP 3: 계획 (3파일 이상 수정 시)

수정 대상 파일이 3개 이상이면 반드시 `ccpp:plan` 스킬 호출.
1~2파일이면 직접 진행.

### STEP 4: 구현 — 파일 기반 스킬 자동 호출

| 수정 파일 확장자 | 필수 스킬 호출 |
|-----------------|---------------|
| `.tsx`, `.jsx` | `frontend-design:frontend-design` |
| `.css`, `.scss` | `ccpp:tailwind-design-system` |
| `.test.ts`, `.spec.*` | `ccpp:tdd` |

| 수정 파일 디렉토리 | 필수 액션 |
|-------------------|----------|
| `auth/`, `login/`, `session/` | `Agent: subagent_type="security-reviewer"` |
| `api/`, `routes/`, `controllers/` | `Agent: subagent_type="security-reviewer"` |
| `components/`, `pages/` | `frontend-design:frontend-design` |

**금지: 위 조건에 해당하는데 스킬을 호출하지 않는 행위**

### STEP 5: 코드 리뷰 (코드 수정 후, 커밋 전) — MUST

코드를 1줄이라도 수정했으면 반드시:

```
Skill: skill="ccpp:review"
```

추가로 `docs/code-review-checklist.md`를 Read하여 과거 교훈이 반복되지 않는지 확인한다.
CRITICAL/HIGH 이슈 → 즉시 수정. MEDIUM 이슈 → 가능하면 수정.

**금지: 리뷰 없이 커밋하는 행위**

### STEP 6: 빌드 확인

```bash
cd client && npm run build
cd server && npm run build
```

빌드 실패 시: `ccpp:build-fix` 스킬 호출

### STEP 7: 문서 기록 (변경이력 필수 작성)

1. **기능 문서 업데이트**: `docs/features/{기능명}.md`의 `last_modified` 변경, `변경 이력` 테이블에 행 추가
2. **INDEX 업데이트**: 새 문서 추가 시 `docs/00-INDEX.md` 매핑 테이블에 행 추가
3. **CLAUDE.md 업데이트**: 기능 목록/기술 스택/스크립트 변경 시 해당 섹션 업데이트
4. **교훈 기록**: 리뷰에서 발견된 패턴/버그 원인 → `docs/code-review-checklist.md` 교훈 테이블에 추가

**금지: 코드만 수정하고 문서를 업데이트하지 않는 행위**

### STEP 8: 커밋

GitHub Desktop으로 직접 커밋

## 에이전트 파이프라인

```
요청 접수 -> 문서 Read -> 스킬 선행 호출 -> 계획 -> 구현 -> ccpp:review -> 빌드검증 -> 문서 기록 -> (GitHub Desktop 커밋)
```

상세 가이드: [docs/agent-workflow.md](./docs/agent-workflow.md)

### 에이전틱 코딩 원칙

- **병렬 실행**: 독립 작업은 Agent `run_in_background`로 동시 실행
- **서브에이전트 위임**: 파일 3개+ 수정 시 `planner` -> `executor` 체이닝
- **빌드는 백그라운드**: 빌드/타입체크는 `run_in_background`로 대기 제거
- **Explore 우선**: 파일 위치 모를 때 Explore 에이전트로 탐색
- **Grep > Read**: 패턴 검색은 Grep, 정확한 위치일 때만 Read
