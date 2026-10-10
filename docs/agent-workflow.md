# 에이전트 활용 워크플로우

## 파이프라인

```
요청 접수 -> 1.탐색 -> 2.계획 -> 3.구현 -> 4.리뷰 -> 5.빌드검증 -> 6.문서 업데이트 -> 7.커밋(사용자)
```

### 1단계: 탐색

| 목적 | 도구 | 설명 |
|------|------|------|
| 코드 위치 | Explore 에이전트 | 빠른 심볼 검색 |
| 문서 확인 | docs/00-INDEX.md Read | 규칙, 히스토리 파악 |
| 라이브러리 문서 | context7 플러그인 | 최신 API 조회 |

### 2단계: 계획

| 조건 | 도구 |
|------|------|
| 3파일+ 수정 | planner 에이전트 |
| 1~2파일 | 직접 진행 |

### 3단계: 구현

| 작업 | 도구 |
|------|------|
| 프론트엔드 | frontend-developer + frontend-design 스킬 |
| 백엔드 | executor (Sonnet) |
| 복잡한 로직 | executor (model=opus) |

### 4단계: 리뷰 (필수)

| 도구 | 설명 |
|------|------|
| code-reviewer | 로직, SOLID, 성능 |
| security-reviewer | 보안 민감 시 |
| code-review-checklist.md | 과거 피드백 반복 방지 |

### 5단계: 빌드검증

| 도구 | 설명 |
|------|------|
| `cd client && npm run build` | 클라이언트 빌드 |
| `cd server && npm run build` | 서버 빌드 |
| build-error-resolver | 빌드 실패 시 자동 수정 |

### 6단계: 문서 업데이트

| 대상 | 조건 |
|------|------|
| CLAUDE.md | 기능, 스택 변경 시 |
| docs/features/*.md | 새 기능 추가 시 |
| docs/00-INDEX.md | 새 md 추가 시 |
| code-review-checklist.md | 교훈 발견 시 |
| product/CHANGELOG.md | 사용자 체감 변경 시 |

### 7단계: 커밋

사용자가 GitHub Desktop으로 직접 커밋합니다.
Claude는 코드 수정과 문서 업데이트까지만 담당합니다.

---

## 요청 유형별 빠른 매핑

| 유형 | 파이프라인 | 핵심 스킬 |
|------|-----------|-----------|
| 버그 수정 | Explore -> 수정 -> 리뷰 -> 빌드 -> 문서 | ccpp:review |
| 새 기능 | Explore -> plan -> 구현 -> 리뷰 -> 빌드 -> 문서 | ccpp:plan -> frontend-design -> ccpp:review |
| UI 개선 | Explore -> ui-ux-pro-max -> 구현 -> frontend-design -> 빌드 -> 문서 | ui-ux-pro-max -> frontend-design |
| 리팩토링 | Explore -> plan -> 구현 -> 리뷰 -> 빌드 -> 문서 | ccpp:plan -> ccpp:review |
| 보안 | Explore -> security -> 구현 -> security -> 빌드 -> 문서 | security-review |
| 하네스/문서 | 직접 수정 | claude-md-management |

---

## 에이전틱 전략

1. Explore 우선 (토큰 절약)
2. 모델 라우팅: 단순 -> Sonnet, 복잡 -> Opus
3. 병렬 에이전트: 독립 작업은 동시 실행
4. 백그라운드: 빌드/테스트는 run_in_background
5. Grep > Read: 패턴 검색은 Grep
