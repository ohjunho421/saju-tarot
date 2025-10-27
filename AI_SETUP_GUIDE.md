# AI 기능 활성화 가이드

## 🚀 빠른 시작

### 1. 환경변수 설정

`server/.env` 파일을 만들고 다음 내용을 추가하세요:

```env
PORT=3001
NODE_ENV=development

# MongoDB (선택사항 - 없어도 작동)
MONGODB_URI=mongodb://localhost:27017/saju-tarot

# JWT Secret (필수)
JWT_SECRET=my-super-secret-key-change-this

# AI API (둘 중 하나만 필수)
GEMINI_API_KEY=당신의_Gemini_API_키
# 또는
# CLAUDE_API_KEY=당신의_Claude_API_키
```

### 2. AI API 키 발급

#### 옵션 1: Gemini API (추천 - 무료)

1. https://makersuite.google.com/app/apikey 방문
2. Google 계정으로 로그인
3. "Create API Key" 클릭
4. 생성된 API 키를 복사
5. `.env` 파일의 `GEMINI_API_KEY`에 붙여넣기

**무료 할당량**: 월 60회 요청 무료

#### 옵션 2: Claude API (Anthropic)

1. https://console.anthropic.com/ 방문
2. 계정 생성 및 로그인
3. API Keys 섹션에서 "Create Key" 클릭
4. 생성된 API 키를 복사
5. `.env` 파일의 `CLAUDE_API_KEY`에 붙여넣기

**요금**: 사용량에 따라 과금

### 3. MongoDB 설치 (선택사항)

AI 기능을 사용하려면 MongoDB가 필요합니다.

#### Windows에서 설치:

```powershell
# Chocolatey 사용
choco install mongodb

# 또는 공식 사이트에서 다운로드
# https://www.mongodb.com/try/download/community
```

#### Docker 사용 (더 쉬움):

```powershell
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

MongoDB 없이도 서버는 실행되지만, 회원가입/로그인 및 AI 기능은 사용할 수 없습니다.

### 4. 서버 재시작

```powershell
# 서버 재시작
cd D:\saju-tarot-service\server
npm run dev
```

## 🎯 AI 기능 사용 방법

### 1. 회원가입
- 웹사이트 우측 상단 "로그인" 버튼 클릭
- "회원가입" 탭 선택
- 이름, 이메일, 비밀번호 입력
- **생년월일시 입력** (이 정보로 자동으로 사주 계산)
- 회원가입 완료 → 자동 로그인

### 2. AI 질문 분석
- 로그인 후 "운세 보러 가기" 클릭
- 생년월일시 입력 (또는 회원가입 시 저장된 정보 사용)
- 타로 리딩 단계에서 질문 입력
- **"AI가 스프레드 추천"** 버튼 클릭
- AI가 질문을 분석하고 최적의 스프레드 추천

### 3. AI 기반 해석
- 질문과 스프레드를 선택하고 "카드 뽑기"
- AI가 다음을 분석:
  - 당신의 사주 만세력
  - 뽑힌 타로 카드
  - 질문의 본질
- **300자 이상의 깊이 있는 해석** 제공
- 오행 조화 분석
- 실천 가능한 맞춤형 조언

### 4. 히스토리 관리
- 모든 리딩은 자동으로 저장
- 언제든지 과거 리딩 조회 가능
- API: `GET /api/ai/my-readings`

## 🔍 AI 기능 동작 확인

### 테스트 방법:

1. **회원가입 테스트**
```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test123",
  "name": "테스트",
  "birthInfo": {
    "year": 1990,
    "month": 5,
    "day": 15,
    "hour": 14,
    "isLunar": false,
    "gender": "male"
  }
}
```

2. **질문 분석 테스트**
```http
POST http://localhost:3001/api/ai/analyze-question
Authorization: Bearer {받은_토큰}
Content-Type: application/json

{
  "question": "올해 나의 재물운은 어떨까요?"
}
```

3. **AI 해석 테스트**
```http
POST http://localhost:3001/api/ai/ai-reading
Authorization: Bearer {받은_토큰}
Content-Type: application/json

{
  "question": "내 직업 전환이 성공할까요?",
  "spreadType": "three-card"
}
```

## 💡 AI 기능 특징

### 질문 분석
- 질문의 의도 파악
- 적합한 스프레드 자동 추천
- 간단한 질문 → 원 카드
- 시간 흐름 → 쓰리 카드
- 재물/건강 → 사주 맞춤형
- 복잡한 상황 → 켈트 십자가

### 통합 해석
- 사주의 일간, 오행 고려
- 타로 카드의 상징 분석
- 질문과의 연관성 파악
- 300자 이상의 깊이 있는 분석

### Fallback 시스템
- AI API 없거나 오류 시
- 자동으로 규칙 기반 추천 사용
- 서비스 중단 없이 작동

## 🐛 문제 해결

### "AI 서비스를 사용할 수 없습니다" 오류
- `.env` 파일에 API 키가 올바르게 설정되었는지 확인
- 서버를 재시작했는지 확인
- API 키의 유효성 확인 (Gemini 콘솔에서 테스트)

### "로그인이 필요합니다" 오류
- MongoDB가 실행 중인지 확인
- 회원가입을 완료했는지 확인
- 토큰이 만료되지 않았는지 확인 (7일)

### MongoDB 연결 오류
- MongoDB가 설치되어 있는지 확인
- MongoDB 서비스가 실행 중인지 확인
- `MONGODB_URI` 설정이 올바른지 확인

### AI 응답이 느림
- Gemini/Claude API의 정상 응답 시간: 2-5초
- 네트워크 연결 상태 확인
- API 사용량 제한 확인

## 📊 비교: AI vs 기본 해석

| 기능 | 기본 해석 | AI 해석 |
|------|---------|---------|
| 로그인 필요 | ❌ | ✅ |
| 질문 분석 | ❌ | ✅ |
| 스프레드 추천 | ❌ | ✅ |
| 해석 길이 | 100-200자 | 300자 이상 |
| 사주 통합 | 기본 | 깊이 있음 |
| 맞춤형 조언 | 일반적 | 구체적 |
| 히스토리 저장 | ❌ | ✅ |

## 🎁 추가 기능

### 1. 리딩 히스토리 조회
```javascript
// 프론트엔드에서
import { aiApi } from './services/api';

const readings = await aiApi.getMyReadings(1, 10);
```

### 2. 특정 리딩 상세 보기
```javascript
const reading = await aiApi.getReadingById(readingId);
```

### 3. 사용자 사주 정보 조회
```javascript
const user = await authApi.getMe();
console.log(user.sajuAnalysis); // 사주 분석 결과
```

## 🔒 보안 참고사항

- API 키는 절대 코드에 하드코딩하지 마세요
- `.env` 파일은 Git에 커밋하지 마세요
- JWT_SECRET은 프로덕션에서 강력한 값으로 변경하세요
- 사용자 비밀번호는 bcrypt로 해싱되어 저장됩니다

## 🚀 프로덕션 배포 시

1. 환경변수를 서버 환경에 설정
2. MongoDB Atlas 사용 권장 (무료 티어 가능)
3. JWT_SECRET을 강력한 랜덤 문자열로 변경
4. CORS 설정을 프로덕션 도메인으로 제한
5. Rate Limiting 추가 권장

---

**문제가 있으면 서버 로그를 확인하세요:**
```powershell
cd D:\saju-tarot-service\server
npm run dev
# 로그에서 "⚡️[server]" 메시지 확인
```
