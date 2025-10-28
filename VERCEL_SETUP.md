# Vercel 환경변수 설정 가이드

## 🔧 중요! 환경변수 설정 필수

Vercel에서 프론트엔드가 백엔드와 통신하려면 **환경변수 설정이 필수**입니다!

## 📋 Railway 백엔드 URL 찾기

1. **Railway Dashboard** 접속: https://railway.app
2. 프로젝트 선택
3. **Settings** → **Networking** → **Public Networking**
4. 도메인 복사 (예: `saju-tarot-production.up.railway.app`)

## 🌐 Vercel 환경변수 설정

### Vercel Dashboard에서:

1. **Vercel Dashboard** → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

```
Name: VITE_API_URL
Value: https://[Railway 도메인]/api

예시:
VITE_API_URL=https://saju-tarot-production.up.railway.app/api
```

**⚠️ 중요**: 
- 끝에 `/api`를 꼭 붙여야 합니다!
- `https://` 포함해야 합니다!
- Railway 도메인은 본인의 것으로 교체하세요!

4. **Environment** 선택: `Production`, `Preview`, `Development` 모두 체크
5. **Save** 클릭

## 🔄 재배포

환경변수를 추가한 후:

1. **Deployments** 탭으로 이동
2. 최신 배포 옆의 **⋯** (점 3개) 클릭
3. **Redeploy** 선택

또는 GitHub에 새로운 커밋을 푸시하면 자동 재배포됩니다.

## ✅ 확인 방법

1. Vercel 사이트 접속
2. 브라우저 개발자 도구 (F12) → Console 탭
3. 에러 메시지 확인
   - ❌ `VITE_API_URL is undefined` → 환경변수 설정 안됨
   - ❌ `CORS error` → Railway CORS 설정 문제
   - ✅ API 요청 성공!

## 🐛 문제 해결

### 회원가입/로그인이 안 될 때:

1. **F12** → **Network** 탭 열기
2. 회원가입 시도
3. API 요청 확인:
   - Request URL이 Railway 도메인인지 확인
   - Status Code 확인 (200 = 성공, 404 = URL 오류, 500 = 서버 오류)

### CORS 에러가 나올 때:

Railway에 다시 배포 필요 (CORS 설정이 업데이트되어야 함)

```bash
git add .
git commit -m "update cors"
git push
```

## 🎯 체크리스트

- [ ] Railway 백엔드 URL 확인
- [ ] Vercel 환경변수에 `VITE_API_URL` 추가
- [ ] `/api` 끝에 붙였는지 확인
- [ ] Vercel에서 재배포
- [ ] 브라우저에서 회원가입 테스트
- [ ] F12 Console에서 에러 확인

---

**문제가 계속되면 Railway 백엔드 URL과 Vercel 사이트 URL을 공유해주세요!**
