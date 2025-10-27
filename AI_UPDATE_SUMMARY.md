# 사주 만세력 타로 서비스 - AI 기능 업데이트 완료

## 🎉 새로 추가된 기능

### 1. **회원가입/로그인 시스템** ✅
- JWT 기반 인증
- 회원가입 시 사주 정보 자동 저장
- 로컬스토리지 토큰 관리
- 인증 미들웨어로 보호된 API

### 2. **AI 기반 질문 분석** ✅
- 사용자 질문을 AI가 분석
- 질문 유형에 따라 최적의 타로 스프레드 자동 추천
- Gemini 또는 Claude API 활용

### 3. **AI 기반 종합 해석** ✅
- 사주 + 타로 + 사용자 질문을 통합 분석
- 300자 이상의 깊이 있는 해석
- 오행 조화 분석
- 맞춤형 실천 가능한 조언

### 4. **리딩 히스토리 저장** ✅
- MongoDB에 모든 리딩 기록 저장
- 페이지네이션 지원
- 과거 리딩 조회 및 비교

## 📁 새로 추가된 파일들

### Backend
```
server/src/
├── models/
│   ├── user.model.ts           # 사용자 모델
│   └── reading.model.ts        # 리딩 히스토리 모델
├── services/
│   └── ai.service.ts           # AI 통합 서비스 (Gemini/Claude)
├── controllers/
│   ├── auth.controller.ts      # 인증 컨트롤러
│   └── ai-interpretation.controller.ts  # AI 해석 컨트롤러
├── routes/
│   ├── auth.routes.ts          # 인증 라우트
│   └── ai-interpretation.routes.ts     # AI 해석 라우트
├── middleware/
│   └── auth.middleware.ts      # JWT 인증 미들웨어
└── utils/
    ├── database.ts             # MongoDB 연결
    └── jwt.ts                  # JWT 유틸리티
```

### Frontend
```
client/src/
└── components/
    └── AuthModal.tsx           # 로그인/회원가입 모달
```

## 🔧 수정된 파일들

### Backend
- `server/src/index.ts`: DB 연결 및 새 라우트 추가
- `server/.env.example`: MongoDB, JWT, AI API 키 설정 추가

### Frontend  
- `client/src/services/api.ts`: 인증 API 및 AI API 함수 추가

## 🚀 설치 및 설정

### 1. 백엔드 패키지 설치
```powershell
cd D:\saju-tarot-service\server
npm install mongoose jsonwebtoken bcryptjs @google/generative-ai @anthropic-ai/sdk
npm install -D @types/jsonwebtoken @types/bcryptjs
```

### 2. 환경변수 설정

`server/.env` 파일 생성:

```env
PORT=3001
NODE_ENV=development

# MongoDB (선택 - 없어도 작동함)
MONGODB_URI=mongodb://localhost:27017/saju-tarot

# JWT Secret
JWT_SECRET=my-super-secret-key-change-this-in-production

# AI API (둘 중 하나만 설정)
# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# 또는 Claude API
# CLAUDE_API_KEY=your_claude_api_key_here
```

### 3. AI API 키 발급 방법

#### Gemini API (Google)
1. https://makersuite.google.com/app/apikey 방문
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. API 키를 `.env`에 추가

#### Claude API (Anthropic)
1. https://console.anthropic.com/ 방문
2. 계정 생성 및 로그인
3. API Keys 섹션에서 새 키 생성
4. API 키를 `.env`에 추가

### 4. MongoDB 설치 (선택사항)

MongoDB 없이도 개발 가능하지만, 설치하면 더 좋습니다:

```powershell
# Windows에서 MongoDB Community Edition 설치
# https://www.mongodb.com/try/download/community

# 또는 Docker 사용
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## 📡 새로운 API 엔드포인트

### 인증 API

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "홍길동",
  "birthInfo": {
    "year": 1990,
    "month": 5,
    "day": 15,
    "hour": 14,
    "isLunar": false,
    "gender": "male"
  }
}

Response:
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "token": "jwt_token_here",
    "user": { ...user info with sajuAnalysis... }
  }
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": { ...user info... }
  }
}
```

#### 내 정보 조회
```http
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": { ...user info with birthInfo and sajuAnalysis... }
}
```

### AI 해석 API (인증 필요)

#### 질문 분석 및 스프레드 추천
```http
POST /api/ai/analyze-question
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "올해 나의 재물운은 어떨까요?"
}

Response:
{
  "success": true,
  "data": {
    "analysis": "재물운에 대한 질문으로, 오행과 관련이 깊습니다.",
    "recommendedSpread": "saju-custom",
    "reason": "사주의 오행 균형과 연결된 맞춤형 스프레드가 적합합니다."
  }
}
```

#### AI 기반 통합 해석
```http
POST /api/ai/ai-reading
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "내 직업 전환은 성공할까요?",
  "spreadType": "three-card"
}

Response:
{
  "success": true,
  "data": {
    "readingId": "...",
    "sajuAnalysis": { ...사용자의 사주 분석... },
    "drawnCards": [ ...뽑힌 카드 정보... ],
    "spreadType": "three-card",
    "question": "내 직업 전환은 성공할까요?",
    "interpretation": "AI가 생성한 통합 해석 (300자 이상)",
    "elementalHarmony": "오행 조화 분석",
    "personalizedAdvice": "맞춤형 조언"
  }
}
```

#### 내 리딩 히스토리
```http
GET /api/ai/my-readings?page=1&limit=10
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "readings": [ ...리딩 목록... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### 특정 리딩 조회
```http
GET /api/ai/readings/{readingId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": { ...리딩 상세 정보... }
}
```

## 🎯 사용 흐름

### 새로운 사용자 흐름
1. **회원가입**
   - 이메일, 비밀번호, 이름, 생년월일시 입력
   - 서버가 자동으로 사주 만세력 계산 및 저장
   - JWT 토큰 발급

2. **로그인**
   - 이메일, 비밀번호로 로그인
   - JWT 토큰 발급 및 로컬스토리지 저장

3. **질문하기**
   - 사용자가 궁금한 내용을 질문
   - AI가 질문을 분석하고 적합한 스프레드 추천

4. **AI 기반 타로 리딩**
   - 추천된 (또는 선택한) 스프레드로 카드 뽑기
   - AI가 사주 + 타로 + 질문을 종합하여 깊이 있는 해석 생성

5. **히스토리 관리**
   - 과거 모든 리딩 기록 저장
   - 언제든지 조회 가능

## 💡 AI 해석의 특징

### 1. 질문 분석 로직
- 간단한 질문 → 원 카드
- 시간 흐름 질문 → 쓰리 카드
- 재물/건강/오행 관련 → 사주 맞춤형
- 복합적 상황 → 켈트 십자가

### 2. 통합 해석 구성
```
[통합 해석]
- 사주의 일간, 강한/약한 오행 고려
- 뽑힌 타로 카드의 의미
- 질문의 본질 파악
- 300자 이상의 깊이 있는 분석

[오행 조화 분석]
- 사주 오행과 타로 카드 오행의 관계
- 상생상극 분석
- 200자 이상

[맞춤형 조언]
- 구체적이고 실천 가능한 조언
- 오행 보완 방법 제시
- 200자 이상
```

### 3. Fallback 메커니즘
- AI API가 없거나 오류 시 자동으로 규칙 기반 추천 사용
- 서비스 중단 없이 작동 보장

## 🔒 보안 고려사항

### JWT 토큰
- 7일 유효기간
- httpOnly는 아니지만 localStorage에 저장
- 프로덕션 환경에서는 httpOnly 쿠키 권장

### 비밀번호
- bcrypt로 해싱 (salt rounds: 10)
- 평문 저장 절대 금지

### 환경변수
- `.env` 파일은 `.gitignore`에 포함
- API 키 절대 코드에 하드코딩하지 않음

## 🐛 알려진 이슈 및 해결

### 1. MongoDB 미설치 시
- 경고 메시지 출력되지만 서버는 계속 작동
- 인증 기능만 사용 불가

### 2. AI API 키 미설정 시
- 질문 분석은 Fallback 로직 사용
- AI 해석은 오류 발생 (필수)

### 3. 토큰 만료
- 401 에러 발생 시 자동 로그아웃
- 프론트엔드에서 재로그인 요청

## 📊 성능 최적화

- MongoDB 인덱스 설정 (email, userId)
- API 응답 캐싱 고려 (향후)
- AI 응답 시간 최적화 필요 (2-5초)

## 🔮 향후 개발 계획

- [ ] 소셜 로그인 (Google, Kakao)
- [ ] AI 프롬프트 최적화
- [ ] 응답 캐싱 시스템
- [ ] 리딩 공유 기능
- [ ] 통계 대시보드
- [ ] 알림 시스템

---

**업데이트 완료일**: 2025-10-28  
**AI 통합**: Gemini (Google) / Claude (Anthropic)  
**인증**: JWT + bcrypt  
**데이터베이스**: MongoDB (Mongoose)
