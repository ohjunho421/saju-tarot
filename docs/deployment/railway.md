---
feature: Railway 배포 (API + 화면)
status: active
last_modified: 2026-11-19
files:
  - Dockerfile
  - railway.json
  - server/src/index.ts
tags: [배포, Docker, Railway, Vercel, 정적 파일]
---

# Railway 배포 (API + 화면)

## 설명

Railway 서비스 하나가 API와 클라이언트 화면을 같은 주소에서 함께 내려준다.

- 주소: `https://saju-tarot-production.up.railway.app`
- 빌드: `railway.json`의 `DOCKERFILE` 빌더. main에 머지되면 자동 배포된다.
- Vercel(`saju-tarot.vercel.app`)은 당분간 그대로 함께 운영한다. Vercel 빌드는 Vercel 쪽 `VITE_API_URL`(Railway API 주소)을 그대로 쓴다.

## Docker 빌드 순서

1. `client/`에서 `npm ci` 후 `VITE_API_URL=/api npm run build` → `client/dist`. API를 같은 주소의 `/api`로 부르게 된다. 빌드 뒤 `client/node_modules`는 지운다.
2. `server/`에서 `npm install` → `prisma generate` → `npm run build`.
3. 시작: `prisma db push` 후 `node dist/index.js`.

## 서버가 화면을 내려주는 규칙 (`server/src/index.ts`)

`client/dist/index.html`이 있을 때만 켜진다. 로컬 개발(`npm run dev`)처럼 빌드가 없으면 API만 동작한다.

| 요청 | 응답 |
|------|------|
| `/api/*`, `/health`, `/tarot-images/*` | 기존 그대로 (화면 규칙보다 먼저 등록) |
| `client/dist`에 있는 파일 | 그 파일. `/assets/*`(해시 붙은 번들)는 1년 캐시(`immutable`) |
| 확장자가 있는데 없는 파일 (예: 배포 후 예전 번들) | 404. HTML을 대신 주지 않는다 |
| 그 외 GET (`/`, `/mypage` 등) | `index.html`, `Cache-Control: no-cache` |

## 주의사항

- 화면 전환은 클라이언트 상태로 하므로 모든 경로가 `index.html`로 가야 한다. 화면 규칙은 API 라우트 뒤, 오류 처리 앞에 둔다.
- 같은 주소에서 부르는 요청은 CORS 대상이 아니다. CORS 허용 목록(`*.vercel.app`)은 Vercel 화면용으로 남겨 둔다.
- 루트 `.dockerignore`의 `node_modules`·`dist`는 루트에만 적용된다. Railway는 git 소스로 빌드하므로 문제없지만, 로컬에서 `docker build`를 하면 `client/node_modules` 등이 함께 올라간다.
- 카카오 로그인 변수(`KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI`)는 `docs/features/auth.md` 참고. 콜백 주소의 origin(이 Railway 주소)은 카카오 로그인 뒤 돌아갈 화면 주소로도 허용된다
- 키·비밀값은 Railway 변수에만 둔다. 이미지나 `VITE_*` 빌드 변수에 넣지 않는다(`VITE_*`는 화면 번들에 그대로 들어간다).

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-11-19 | 문서 신설. Docker 빌드에 클라이언트 빌드를 추가하고 서버가 `client/dist`를 정적 파일 + 화면 경로 대체로 내려주게 함. Vercel은 병행 | Dockerfile, server/src/index.ts | 사용자 요청(Railway에서 화면까지 제공) |
