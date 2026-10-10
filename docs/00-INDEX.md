---
type: index
last_modified: 2026-05-25
---

# 별사탕 문서 인덱스

> CLAUDE.md STEP 1에 의해 이 파일 읽기는 필수입니다.
> 코드를 수정하기 전에 이 매핑에서 관련 문서를 찾아 반드시 Read하세요.

## 요청 → 문서 매핑

### 핵심 기능

| 키워드 | 문서 경로 | 관련 코드 |
|--------|-----------|-----------|
| 사주, 팔자, 오행, 음양, 천간, 지지 | docs/features/saju-analysis.md | `saju.service.ts`, `SajuResult.tsx` |
| 타로, 카드, 스프레드, 리딩, 드로우 | docs/features/tarot-reading.md | `tarot.service.ts`, `TarotReading.tsx`, `CardSelection.tsx` |
| AI, 해석, Gemini, Claude, 프롬프트 | docs/features/ai-interpretation.md | `ai.service.ts`, `interpretation.service.ts` |
| 로그인, 회원가입, 인증, JWT, 비밀번호 | docs/features/auth.md | `auth.routes.ts`, `auth.controller.ts`, `AuthModal.tsx` |
| 히스토리, 기록, 리딩 목록, 저장 | docs/features/reading-history.md | `reading.routes.ts`, `reading.controller.ts`, `HistoryPage.tsx` |
| 포인트, 결제, 충전, 잔액 | docs/features/point-system.md | `schema.prisma` (PointTransaction) |
| 챗봇, 채팅, 대화, 후속질문 | docs/features/chatbot.md | `chat.controller.ts`, `ChatBot.tsx` |
| 띠, 운세, 별자리, 궁합 | docs/features/zodiac.md | `zodiac.service.ts` |
| 리뷰, 체크리스트, 교훈 | docs/code-review-checklist.md | - |

### 인프라/운영

| 키워드 | 문서 경로 | 관련 코드 |
|--------|-----------|-----------|
| 배포, Docker, Railway | deployment/ (추후 추가) | `Dockerfile`, `railway.json` |
| DB, Prisma, 마이그레이션 | deployment/ (추후 추가) | `server/prisma/schema.prisma` |
| 환경변수, API 키 | deployment/ (추후 추가) | `.env.example` |

### 제품

| 키워드 | 문서 경로 |
|--------|-----------|
| 변경 이력, 릴리스 | product/CHANGELOG.md |

## 카테고리 구조

```
docs/
├── 00-INDEX.md                 ← 이 파일 (요청 라우팅)
├── agent-workflow.md            에이전트 파이프라인 가이드
├── code-review-checklist.md     리뷰 교훈 누적
├── features/                    기능별 사양 + 변경이력
│   ├── saju-analysis.md         사주 분석
│   ├── tarot-reading.md         타로 리딩
│   ├── ai-interpretation.md     AI 해석
│   ├── auth.md                  회원 인증
│   ├── reading-history.md       리딩 히스토리
│   ├── point-system.md          포인트 시스템
│   ├── chatbot.md               챗봇
│   └── zodiac.md                띠/별자리 운세
├── deployment/                  배포, 인프라
├── operations/                  환경, 테스트, 점검
└── product/
    └── CHANGELOG.md             변경 이력
```

## 새 문서 추가 규칙

1. `docs/features/{기능명}.md`를 기능 md 템플릿으로 생성
2. 이 INDEX의 매핑 테이블에 행 추가
3. CLAUDE.md의 기능 목록에도 반영
