# 배포 가이드

## 🚂 백엔드 배포 (Railway) - 완료 ✅

백엔드는 이미 Railway에 배포되었습니다!

### Railway 백엔드 URL 확인하기
1. [Railway Dashboard](https://railway.app)에 로그인
2. 프로젝트 선택
3. **Settings** → **Domains** 에서 도메인 확인
4. 예: `https://saju-tarot-production.up.railway.app`

---

## 🌐 프론트엔드 배포 (Vercel)

### 1단계: Railway 백엔드 URL 설정

먼저 Railway에서 백엔드 URL을 복사한 후:

```bash
# client/.env.production 파일 수정
VITE_API_URL=https://your-railway-backend.railway.app/api
```

**중요**: `/api`를 끝에 꼭 붙여주세요!

### 2단계: Vercel CLI 설치 및 로그인

```bash
# Vercel CLI 설치 (글로벌)
npm install -g vercel

# Vercel 로그인
vercel login
```

### 3단계: 프론트엔드 배포

```bash
# client 폴더로 이동
cd D:\saju-tarot-service\client

# Vercel에 배포
vercel

# 프로덕션 배포 (최종)
vercel --prod
```

### 4단계: 배포 완료!

Vercel이 자동으로:
- ✅ React 앱 빌드
- ✅ 도메인 생성 (예: `saju-tarot.vercel.app`)
- ✅ HTTPS 자동 설정
- ✅ GitHub 연동 (자동 배포)

---

## 🔧 또는: Vercel 웹사이트에서 배포

1. [Vercel](https://vercel.com)에 로그인
2. **Import Project** 클릭
3. GitHub 저장소 선택: `ohjunho421/saju-tarot`
4. **Root Directory** 설정: `client`
5. **Environment Variables** 추가:
   ```
   VITE_API_URL=https://your-railway-backend.railway.app/api
   ```
6. **Deploy** 클릭!

---

## 📋 환경변수 체크리스트

### Railway (백엔드)
- ✅ `NODE_ENV=production`
- ✅ `DATABASE_URL=${{DATABASE.DATABASE_URL}}`
- ✅ `JWT_SECRET=...`
- ✅ `GEMINI_API_KEY=...`
- ✅ `ANTHROPIC_API_KEY=...`

### Vercel (프론트엔드)
- ⏳ `VITE_API_URL=https://[Railway 도메인]/api`

---

## 🔗 최종 결과

- **프론트엔드**: https://saju-tarot.vercel.app
- **백엔드 API**: https://your-railway-app.railway.app/api

---

## ⚠️ CORS 설정 확인

백엔드의 `src/index.ts`에서 CORS 설정이 Vercel 도메인을 허용하는지 확인하세요:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://saju-tarot.vercel.app',  // Vercel 도메인 추가
    'https://*.vercel.app'  // 모든 Vercel 프리뷰 허용
  ],
  credentials: true
}));
```

---

## 🎉 완료!

이제 Vercel URL로 접속하면 프론트엔드가 보일 것입니다!
