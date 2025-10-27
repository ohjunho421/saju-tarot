# 사주 만세력 타로 서비스 - 설치 및 실행 가이드

## 🎯 프로젝트 개요

이 프로젝트는 사주 만세력 계산과 타로 카드 해석을 통합한 웹 서비스입니다.
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **주요 기능**: 사주 분석, 타로 리딩, 통합 해석

## 📋 사전 요구사항

- Node.js 18 이상
- npm 또는 pnpm

## 🚀 빠른 시작

### 1. 백엔드 서버 실행

```powershell
# 서버 디렉토리로 이동
cd D:\saju-tarot-service\server

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm run dev
```

서버가 http://localhost:3001 에서 실행됩니다.

### 2. 프론트엔드 실행

새 터미널 창을 열고:

```powershell
# 클라이언트 디렉토리로 이동
cd D:\saju-tarot-service\client

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 http://localhost:5173 에서 실행됩니다.

### 3. 브라우저에서 접속

http://localhost:5173 을 브라우저에서 열어 서비스를 이용하세요!

## 🔍 API 테스트

### Health Check
```powershell
curl http://localhost:3001/health
```

### 사주 분석 API 테스트
```powershell
# PowerShell 스크립트 실행
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

또는 직접 API 호출:
```powershell
$body = @{
    year = 1990
    month = 5
    day = 15
    hour = 14
    isLunar = $false
    gender = "male"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/saju/analyze" -Method Post -Body $body -ContentType "application/json"
```

## 📁 프로젝트 구조

```
saju-tarot-service/
├── client/                     # React 프론트엔드
│   ├── src/
│   │   ├── components/        # UI 컴포넌트
│   │   │   ├── BirthInfoForm.tsx      # 생년월일시 입력 폼
│   │   │   ├── SajuResult.tsx         # 사주 분석 결과
│   │   │   ├── TarotReading.tsx       # 타로 선택
│   │   │   └── IntegratedResult.tsx   # 통합 해석 결과
│   │   ├── pages/            # 페이지 컴포넌트
│   │   │   ├── HomePage.tsx          # 홈페이지
│   │   │   └── ReadingPage.tsx       # 리딩 진행 페이지
│   │   ├── services/         # API 통신
│   │   │   └── api.ts
│   │   ├── types/            # TypeScript 타입
│   │   │   └── index.ts
│   │   └── App.tsx           # 메인 앱
│   └── package.json
│
├── server/                    # Express 백엔드
│   ├── src/
│   │   ├── controllers/      # API 컨트롤러
│   │   │   ├── saju.controller.ts
│   │   │   ├── tarot.controller.ts
│   │   │   └── interpretation.controller.ts
│   │   ├── services/         # 비즈니스 로직
│   │   │   ├── saju.service.ts           # 사주 계산
│   │   │   ├── tarot.service.ts          # 타로 관리
│   │   │   └── interpretation.service.ts # 통합 해석
│   │   ├── models/           # 데이터 모델
│   │   │   ├── saju.model.ts
│   │   │   └── tarot.model.ts
│   │   ├── routes/           # API 라우트
│   │   │   ├── saju.routes.ts
│   │   │   ├── tarot.routes.ts
│   │   │   └── interpretation.routes.ts
│   │   ├── data/             # 타로 카드 데이터
│   │   │   └── tarot-cards.ts
│   │   └── index.ts          # 서버 진입점
│   └── package.json
│
├── .taskmaster/              # Taskmaster 프로젝트 관리
│   └── docs/
│       └── prd.txt          # 제품 요구사항 문서
│
├── README.md                # 프로젝트 개요
└── SETUP.md                 # 이 파일
```

## 🎮 사용 방법

### 1단계: 생년월일시 입력
- 양력/음력 선택
- 년, 월, 일 입력
- 태어난 시간 선택 (0-23시)
- 성별 선택

### 2단계: 사주 분석 확인
- 사주 만세력 차트 (년/월/일/시주)
- 오행 균형 분석
- 성격 분석 및 강점/약점
- 개인화된 추천사항

### 3단계: 타로 스프레드 선택
- **원 카드**: 간단한 질문
- **쓰리 카드**: 과거-현재-미래
- **켈트 십자가**: 종합 운세 (10장)
- **사주 맞춤형**: 오행별 분석 (5장)

### 4단계: 통합 해석 결과
- 뽑힌 타로 카드 확인
- 사주와 타로의 통합 해석
- 오행 조화 분석
- 맞춤형 조언

## 🛠️ 개발 명령어

### 백엔드
```powershell
npm run dev      # 개발 서버 (hot reload)
npm run build    # 프로덕션 빌드
npm start        # 프로덕션 서버 실행
```

### 프론트엔드
```powershell
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
```

## 🔧 환경 변수

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
# OPENAI_API_KEY=your_key  # AI 해석 기능용 (선택)
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 📡 API 엔드포인트

### 사주 분석
```
POST /api/saju/analyze
Body: { year, month, day, hour, isLunar, gender }
Response: 사주 분석 결과 (천간, 지지, 오행, 성격 등)
```

### 타로 카드
```
POST /api/tarot/draw
Body: { spreadType, question? }
Response: 뽑힌 카드 및 기본 해석

GET /api/tarot/cards
Response: 전체 타로 카드 목록
```

### 통합 해석
```
POST /api/interpretation/integrated
Body: { birthInfo, spreadType, question? }
Response: 사주 + 타로 통합 분석
```

## 🐛 문제 해결

### 포트 충돌
이미 3001 또는 5173 포트가 사용 중이라면:

**Backend 포트 변경**:
`server/.env` 파일에서 `PORT=3002` 로 변경

**Frontend API URL 변경**:
`client/.env` 파일에서 `VITE_API_URL=http://localhost:3002/api` 로 변경

### CORS 오류
Backend에서 CORS가 이미 활성화되어 있습니다. 
만약 문제가 있다면 `server/src/index.ts`의 cors 설정을 확인하세요.

### TypeScript 오류
```powershell
# 타입 정의 재설치
cd server
npm install

cd ../client
npm install
```

## 🎨 커스터마이징

### 타로 카드 추가
`server/src/data/tarot-cards.ts` 파일에 새 카드 추가

### 테마 색상 변경
`client/tailwind.config.js`의 `colors` 섹션 수정

### 스프레드 추가
1. `server/src/models/tarot.model.ts`에 타입 추가
2. `SPREAD_POSITIONS`에 포지션 정의
3. Frontend 타입 동기화

## 📈 다음 단계

현재 MVP가 완성되었습니다. 추가 기능:

- [ ] AI 기반 해석 (OpenAI/Claude API 연동)
- [ ] 사용자 히스토리 저장 (LocalStorage or DB)
- [ ] 공유 기능 강화
- [ ] 궁합 분석
- [ ] 일간/주간/월간 운세
- [ ] 애니메이션 개선
- [ ] 프로덕션 배포 (Vercel + Railway)

## 🤝 기여하기

Pull Request와 Issue는 언제나 환영합니다!

## ⚠️ 면책 조항

본 서비스는 엔터테인먼트 목적으로 제공되며, 의료, 법률, 재정 조언이 아닙니다.

---

문제가 있거나 질문이 있으시면 Issue를 등록해주세요!
