# 사주 만세력 기반 타로 해석 서비스

동양의 사주 만세력과 서양의 타로 카드를 융합한 통합 운세 해석 서비스입니다.

## 🌟 주요 기능

- **사주 만세력 계산**: 생년월일시 기반 정통 사주 분석
- **오행 균형 분석**: 목화토금수 오행의 균형 상태 파악
- **타로 카드 리딩**: 다양한 스프레드 방식의 타로 해석
- **통합 해석 시스템**: 사주와 타로의 상관관계 분석
- **개인화된 조언**: 오행 균형에 맞춘 맞춤형 추천

## 📁 프로젝트 구조

```
saju-tarot-service/
├── client/                 # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/    # 재사용 가능한 컴포넌트
│   │   ├── pages/         # 페이지 컴포넌트
│   │   ├── services/      # API 통신
│   │   ├── types/         # TypeScript 타입 정의
│   │   └── store/         # 상태 관리
│   └── package.json
├── server/                # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/   # API 컨트롤러
│   │   ├── services/      # 비즈니스 로직
│   │   ├── models/        # 데이터 모델
│   │   ├── routes/        # API 라우트
│   │   ├── data/          # 타로 카드 데이터
│   │   └── utils/         # 유틸리티 함수
│   └── package.json
└── README.md
```

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+ 
- npm or pnpm

### 설치

1. 저장소 클론 및 디렉토리 이동
```bash
cd D:\saju-tarot-service
```

2. 백엔드 의존성 설치
```bash
cd server
npm install
```

3. 프론트엔드 의존성 설치
```bash
cd ../client
npm install
```

### 환경 변수 설정

서버 디렉토리에 `.env` 파일을 생성하세요:

```bash
cd server
cp .env.example .env
```

그리고 `.env` 파일을 열어서 실제 API 키를 입력하세요:

```env
PORT=3001
NODE_ENV=development

# Database (로컬 개발용 SQLite)
DATABASE_URL=file:./dev.db

# JWT Secret (랜덤 문자열로 변경 필수!)
JWT_SECRET=your-secret-key-change-in-production

# AI API Keys (하나 이상 필수)
GEMINI_API_KEY=실제_구글_제미나이_API_키
ANTHROPIC_API_KEY=실제_클로드_API_키
```

**⚠️ 중요**: 
- `.env` 파일은 **절대 GitHub에 업로드하지 마세요**
- 이미 `.gitignore`에 추가되어 있어 자동으로 제외됩니다
- API 키는 본인의 실제 키로 교체하세요

### 실행

1. 백엔드 서버 실행
```bash
cd server
npm run dev
```

2. 프론트엔드 개발 서버 실행 (새 터미널)
```bash
cd client
npm run dev
```

3. 브라우저에서 접속
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: Lucide React (아이콘)
- **Animation**: Framer Motion
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js + TypeScript
- **만세력 계산**: lunar-javascript
- **AI Integration**: OpenAI API (선택)

## 📖 API 엔드포인트

### 사주 분석
```
POST /api/saju/analyze
Body: { year, month, day, hour, isLunar, gender }
Response: 사주 분석 결과
```

### 타로 카드
```
POST /api/tarot/draw
Body: { spreadType, question? }
Response: 뽑힌 타로 카드 및 기본 해석

GET /api/tarot/cards
Response: 모든 타로 카드 목록
```

### 통합 해석
```
POST /api/interpretation/integrated
Body: { birthInfo, spreadType, question? }
Response: 사주 + 타로 통합 해석
```

## 🔮 사주 만세력 계산 로직

1. **간지 계산**: 년/월/일/시주의 천간(天干)과 지지(地支) 산출
2. **오행 분석**: 목화토금수 오행의 분포 계산
3. **일간 파악**: Day Master를 기준으로 성격 분석
4. **십신 산정**: 비견, 겫재, 식신 등 십신 관계 파악

## 🎴 타로 시스템

### 지원 스프레드
- **원 카드**: 간단한 질문
- **쓰리 카드**: 과거-현재-미래
- **켈트 십자가**: 종합 운세 (10장)
- **사주 맞춤형**: 오행별 카드 배치 (5장)

### 오행-타로 매칭
- 목(木) ↔ Wands (지팡이) - 성장, 창조
- 화(火) ↔ Cups (컵) - 감정, 관계
- 토(土) ↔ Pentacles (펜타클) - 안정, 물질
- 금(金) ↔ Swords (검) - 논리, 결단
- 수(水) ↔ Major Arcana 수 관련 카드 - 지혜, 직관

## 🎯 로드맵

### Phase 1 - MVP (완료)
- [x] 프로젝트 구조 설정
- [x] 사주 계산 로직 구현
- [x] 타로 카드 데이터베이스
- [x] 기본 API 구축
- [x] 홈페이지 UI

### Phase 2 - 핵심 기능 (진행 중)
- [ ] 생년월일시 입력 폼
- [ ] 타로 카드 선택 UI
- [ ] 사주 결과 시각화
- [ ] 타로 리딩 애니메이션
- [ ] 통합 해석 페이지

### Phase 3 - 고도화
- [ ] AI 기반 해석 (OpenAI/Claude)
- [ ] 히스토리 저장 기능
- [ ] 공유 기능
- [ ] 궁합 분석
- [ ] 일간/주간/월간 운세

### Phase 4 - 배포
- [ ] 프로덕션 최적화
- [ ] 배포 (Vercel + Railway)
- [ ] 모니터링 설정

## 🚢 GitHub에 올리기

### 체크리스트

**올리기 전 확인사항:**
- ✅ `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- ✅ `.env.example` 파일은 포함 (실제 키 없이)
- ✅ API 키가 코드에 하드코딩되지 않았는지 확인
- ✅ `node_modules/` 가 `.gitignore`에 있는지 확인
- ✅ 데이터베이스 파일(`*.db`)이 제외되는지 확인

### Git 명령어

```bash
# Git 초기화 (아직 안했다면)
git init

# 변경사항 확인 (.env가 포함되지 않았는지 확인!)
git status

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit: 사주 만세력 타로 서비스"

# GitHub 저장소와 연결 (본인의 저장소 URL로 변경)
git remote add origin https://github.com/your-username/saju-tarot-service.git

# 푸시
git push -u origin main
```

### ⚠️ Private vs Public

**Private 저장소 (추천):**
- API 키를 실수로 올려도 노출 위험 감소
- 하지만 여전히 `.env`는 제외해야 함
- 팀원과만 공유 가능

**Public 저장소:**
- 포트폴리오용으로 좋음
- **반드시** `.env` 파일 제외 확인
- `.env.example`만 포함하여 사용법 안내

**결론: Private이든 Public이든 `.env`는 절대 올리면 안 됨!**

## 📝 개발 가이드

### 새 타로 카드 추가
`server/src/data/tarot-cards.ts`에 카드 데이터 추가

### 새 스프레드 타입 추가
1. `server/src/models/tarot.model.ts`에 타입 추가
2. `SPREAD_POSITIONS`에 포지션 정의 추가
3. 프론트엔드 타입 동기화

### API 테스트
```bash
# 사주 분석 테스트
curl -X POST http://localhost:3001/api/saju/analyze \
  -H "Content-Type: application/json" \
  -d '{"year":1990,"month":5,"day":15,"hour":14,"isLunar":false,"gender":"male"}'
```

## ⚠️ 주의사항

- 본 서비스는 **엔터테인먼트 목적**으로 제공됩니다
- 의료, 법률, 재정 조언이 아닙니다
- 사주 계산 결과는 참고용이며 절대적이지 않습니다

## 📄 라이선스

MIT License

## 👥 기여

Pull Request와 Issue는 언제나 환영합니다!

---

**Made with 🔮 & ❤️**
