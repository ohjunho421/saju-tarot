---
feature: 회원 인증
status: active
last_modified: 2026-11-19
files:
  - server/src/routes/auth.routes.ts
  - server/src/controllers/auth.controller.ts
  - server/src/middleware/auth.middleware.ts
  - server/src/utils/jwt.ts
  - client/src/components/AuthModal.tsx
  - server/src/controllers/kakao-auth.controller.ts
  - server/src/services/kakao.service.ts
  - client/src/pages/KakaoSignupPage.tsx
  - client/src/components/KakaoLoginButton.tsx
  - client/src/services/kakaoRedirect.ts
tags: [로그인, 회원가입, 인증, JWT, bcrypt, MBTI, 카카오, 소셜 로그인]
---

# 회원 인증

## 설명

이메일/비밀번호 기반 회원가입·로그인과 카카오 로그인. JWT 토큰 인증, bcryptjs 비밀번호 해싱.
회원가입 시 사주 분석을 자동 수행하여 DB에 저장한다.

카카오에서는 회원번호와 닉네임만 받는다. 카카오로 처음 들어오면 "가입 마무리" 화면이 나온다.
1단계에서 이름(카카오 닉네임을 미리 채움)과 생년월일·양력/음력·성별·태어난 시간을 직접 입력하고, 2단계에서 생일로 정해진 별자리를 보여 주고 MBTI만 묻는다(건너뛰기 가능). 가입하면 바로 리딩으로 가며, 저장된 생년월일 덕분에 생년월일 단계는 건너뛴다.

## 핵심 로직

- `POST /auth/register` — 이메일 중복 체크 → bcrypt 해싱 → 사주 분석 → User 생성 → JWT 발급
- `POST /auth/login` — 이메일 조회 → bcrypt 비교 → JWT 발급
- `GET /auth/me` — authMiddleware 필수, 토큰 기반 사용자 정보 반환
- `PUT /auth/mbti` — MBTI 업데이트 (16가지 유효값 검증)
- `authMiddleware` — JWT 검증, `req.user`에 userId 주입
- 회원가입 시 `sajuService.analyzeSaju(birthInfo)` 호출하여 `sajuAnalysis` 필드에 저장

### 카카오 로그인 (`kakao-auth.controller.ts`)

- `GET /auth/providers` — 키가 설정된 소셜 로그인만 `true`. 화면은 이 값으로 카카오 버튼을 보이거나 숨긴다
- `GET /auth/kakao/start?returnTo=<화면 주소>&bind=<해시>` — 돌아갈 주소를 허용 목록과 정확히 비교 → 무작위 값을 httpOnly 쿠키(SameSite=Lax, 10분)에 넣고, 같은 값과 bind 해시를 담은 서명 state로 카카오 인가 화면에 보낸다. bind는 화면이 만든 무작위 값으로, 원래 값은 그 브라우저 localStorage(`kakao_login_bind`, 15분)에만 있고 서버에는 SHA-256 해시만 간다
- `GET /auth/kakao/callback` — state 서명과 쿠키 값을 비교(로그인 CSRF 방지) → 서버에서 인가 코드를 토큰으로 바꾸고 사용자 정보 조회 → 화면 주소 `#` 뒤에 표를 붙여 돌려보낸다. 기존 회원 `#kakao_login=<표, 2분>`, 새 회원 `#kakao_signup=<표, 30분>`, 실패 `#kakao_error=cancelled|failed|expired|unavailable`
- `POST /auth/kakao/session { ticket, bind }` — 로그인 표면 JWT 발급, 가입 표면 미리 채울 닉네임 반환
- `POST /auth/kakao/complete { ticket, bind, name, birthInfo, mbti }` — 생년월일·이름 검증 → 사주 분석 → `kakaoId`로 User 생성 → JWT 발급. 같은 카카오 계정이 이미 있으면 409("카카오로 다시 로그인"). 가입 표(30분)는 로그인 수단으로 쓰지 않는다. 사주 분석이 실패하면 가입하지 않고 날짜 확인을 요청한다(`sajuAnalysis`가 필수 열이라 비워 둘 수 없다)
- 표는 로그인 JWT와 다른 비밀값(`JWT_SECRET` + 접미사)으로 서명하고 `typ`(kakao-state·kakao-login·kakao-signup)을 함께 확인한다. 로그인 토큰을 표로, 표를 로그인 토큰으로 쓸 수 없다
- 화면은 `#` 뒤 값을 읽자마자 `history.replaceState`로 주소에서 지운다(`kakaoRedirect.ts`). 가입 표의 닉네임은 서명만 되고 암호화는 안 된 채 주소에 실린다(본인 브라우저 방문 기록에 남을 수 있음)
- state는 한 번만 쓴다(서버 메모리). 콜백은 IP당 10분 30회, 가입 마무리는 10분 20회로 제한한다(`createUserRateLimiter`). IP는 Railway 프록시가 붙인 `X-Forwarded-For` 마지막 값으로 읽고, 앱 전체 `trust proxy`는 켜지 않았다
- session·complete는 bind 원래 값의 해시가 표 안의 해시와 같아야 받는다. 남이 자기 카카오로 받은 표를 링크(`#kakao_login=…`)로 보내도, 받은 사람 브라우저에는 bind가 없어 남의 계정으로 로그인되지 않는다(로그인 CSRF). 쿠키로 묶지 않는 이유: Vercel 화면 → Railway API는 교차 사이트 요청이라 서드파티 쿠키 차단에 걸린다

## 주의사항

- bcrypt salt rounds = 10
- MBTI 유효값 16종 하드코딩 검증 (`INTJ`, `INTP`, ..., `ESFP`)
- JWT 토큰은 클라이언트에서 localStorage에 저장 (httpOnly 쿠키 마이그레이션 고려 중)
- 비밀번호는 절대 응답에 포함하지 않음
- 회원가입 시 사주 분석 실패해도 회원 생성은 진행되어야 함
- 로컬에서 `npm run dev`(tsx)로 띄우면 `jwt.ts`가 `server/.env`를 읽기 전에 비밀값을 정해 `JWT_SECRET` 기본값을 쓴다(예전부터 그렇다). 시험용 토큰·표를 직접 만들 때 주의. Railway는 환경변수를 직접 넣어 해당 없음
- 카카오로 가입한 사용자는 `email`·`password`가 없다(둘 다 nullable). 이메일 로그인은 비밀번호가 없으면 같은 "올바르지 않습니다"로 거절한다. 이메일 계정과 카카오 계정을 자동으로 합치지 않는다
- 카카오 환경변수(`server/.env.example`): `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET`(콘솔에서 켜 둔 경우), `KAKAO_REDIRECT_URI`(콘솔에 똑같이 등록), 선택 `SOCIAL_LOGIN_RETURN_ORIGINS`. 키가 없으면 카카오 버튼이 숨겨진다
- 돌아갈 주소 허용 목록에 CORS의 `*.vercel.app` 패턴을 쓰지 않는다. 기본값은 운영 `saju-tarot.vercel.app`, 로컬 `localhost:5173·3001`, 그리고 콜백 주소의 서버. Vercel 미리보기 주소에서 카카오 로그인을 쓰려면 `SOCIAL_LOGIN_RETURN_ORIGINS`에 넣는다
- 카카오 개발자 콘솔 설정(비즈 앱 불필요): 앱 생성 → 카카오 로그인 켜기 → Redirect URI 등록 → 동의항목 닉네임(profile_nickname) 켜기 → (선택) Client Secret 켜기. 카카오의 생일·출생 연도·성별은 비즈 앱 전환과 동의항목 심사가 필요해 쓰지 않기로 했다(2026-11-19). 나중에 미리 채우려면 `parseKakaoUser`에서 `kakao_account.birthday`·`birthyear`·`birthday_type`·`gender`를 읽어 가입 표에 실으면 된다
- 결제(포트원) 작업을 합칠 때: 그쪽 이메일 가입에 있는 필수 약관 동의·동의 시각 기록·가입 포인트 지급을 카카오 가입(`completeKakaoSignup`, `KakaoSignupPage`)에도 똑같이 넣고, 개인정보처리방침의 수집 항목에 카카오에서 받는 값(회원번호, 닉네임)을 적는다

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
| 2026-11-19 | 카카오 로그인 추가. 생년월일을 직접 입력하고 별자리를 보여 준 뒤 MBTI만 묻는 가입 마무리 화면(카카오 생년월일 가져오기는 비즈 앱·심사가 필요해 제외), email·password nullable과 kakaoId 추가, 비밀번호 없는 계정의 이메일 로그인 거절 | `kakao-auth.controller.ts`, `kakao.service.ts`, `jwt.ts`, `auth.routes.ts`, `auth.controller.ts`, `schema.prisma`, `KakaoSignupPage.tsx`, `KakaoLoginButton.tsx`, `kakaoRedirect.ts`, `AuthModal.tsx`, `BirthInfoForm.tsx`, `App.tsx`, `api.ts`, `MyPage.tsx` | 사용자 요청(카카오 로그인) |
