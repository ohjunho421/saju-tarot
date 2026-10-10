---
feature: 회원 인증
status: active
last_modified: 2026-05-25
files:
  - server/src/routes/auth.routes.ts
  - server/src/controllers/auth.controller.ts
  - server/src/middleware/auth.middleware.ts
  - server/src/utils/jwt.ts
  - client/src/components/AuthModal.tsx
tags: [로그인, 회원가입, 인증, JWT, bcrypt, MBTI]
---

# 회원 인증

## 설명

이메일/비밀번호 기반 회원가입·로그인 시스템. JWT 토큰 인증, bcryptjs 비밀번호 해싱.
회원가입 시 사주 분석을 자동 수행하여 DB에 저장한다.

## 핵심 로직

- `POST /auth/register` — 이메일 중복 체크 → bcrypt 해싱 → 사주 분석 → User 생성 → JWT 발급
- `POST /auth/login` — 이메일 조회 → bcrypt 비교 → JWT 발급
- `GET /auth/me` — authMiddleware 필수, 토큰 기반 사용자 정보 반환
- `PUT /auth/mbti` — MBTI 업데이트 (16가지 유효값 검증)
- `authMiddleware` — JWT 검증, `req.user`에 userId 주입
- 회원가입 시 `sajuService.analyzeSaju(birthInfo)` 호출하여 `sajuAnalysis` 필드에 저장

## 주의사항

- bcrypt salt rounds = 10
- MBTI 유효값 16종 하드코딩 검증 (`INTJ`, `INTP`, ..., `ESFP`)
- JWT 토큰은 클라이언트에서 localStorage에 저장 (httpOnly 쿠키 마이그레이션 고려 중)
- 비밀번호는 절대 응답에 포함하지 않음
- 회원가입 시 사주 분석 실패해도 회원 생성은 진행되어야 함

## 변경 이력

| 날짜 | 변경 내용 | 수정 파일 | 이유 |
|------|-----------|-----------|------|
| 2026-05-25 | 초기 문서화 | - | harness-init |
