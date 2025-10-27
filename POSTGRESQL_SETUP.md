# PostgreSQL 설정 가이드 🐘

## ✅ MongoDB → PostgreSQL 마이그레이션 완료!

Railway 배포를 위해 PostgreSQL + Prisma로 전환했습니다.

## 🚀 로컬 개발 설정

### 1. PostgreSQL 설치

#### Windows (권장)
```powershell
# Chocolatey 사용
choco install postgresql

# 또는 공식 사이트에서 설치
# https://www.postgresql.org/download/windows/
```

#### Docker 사용 (더 쉬움)
```powershell
docker run -d `
  --name saju-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_DB=saju_tarot `
  -p 5432:5432 `
  postgres:15
```

### 2. 환경변수 설정

`server/.env` 파일 생성:

```env
PORT=3001
NODE_ENV=development

# PostgreSQL (로컬)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saju_tarot

# JWT Secret
JWT_SECRET=my-super-secret-key

# AI API (하나만 필요)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Prisma 마이그레이션

```powershell
cd D:\saju-tarot-service\server

# Prisma Client 생성
npx prisma generate

# 데이터베이스 마이그레이션 실행
npx prisma migrate dev --name init

# Prisma Studio로 데이터 확인 (선택사항)
npx prisma studio
```

### 4. 서버 재시작

```powershell
npm run dev
```

## 🎯 Prisma 스키마

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  name          String
  birthInfo     Json     // 사주 생년월일시 정보
  sajuAnalysis  Json     // 사주 분석 결과
  createdAt     DateTime @default(now())
  lastLoginAt   DateTime?
  readings      Reading[]
}

model Reading {
  id                       String   @id @default(cuid())
  userId                   String
  question                 String
  spreadType               String
  drawnCards               Json
  interpretation           String
  elementalHarmony         String
  personalizedAdvice       String
  adviceCardInterpretation String?
  aiProvider               String?
  createdAt                DateTime @default(now())
}
```

## 🌐 Railway 배포

### 1. Railway 프로젝트 생성

1. https://railway.app/ 접속
2. GitHub 저장소 연결
3. "New Project" → "Deploy from GitHub repo"

### 2. PostgreSQL 추가

1. Railway 대시보드에서 "+ New" 클릭
2. "Database" → "PostgreSQL" 선택
3. 자동으로 DATABASE_URL이 생성됩니다

### 3. 환경변수 설정

Railway 대시보드의 "Variables" 탭에서:

```
DATABASE_URL=postgresql://... (자동 생성됨)
JWT_SECRET=your-production-secret-key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=production
```

### 4. 빌드 및 배포 설정

`server/package.json`에 추가:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  }
}
```

Railway에서 빌드 명령:
```
npm run prisma:generate && npm run build
```

시작 명령:
```
npm run prisma:migrate && npm start
```

### 5. 자동 배포

- main 브랜치에 push하면 자동 배포
- Railway가 DATABASE_URL 자동 주입
- Prisma 마이그레이션 자동 실행

## 📊 데이터베이스 관리

### Prisma Studio (GUI)
```powershell
npx prisma studio
# http://localhost:5555 에서 데이터 확인
```

### 마이그레이션 생성
```powershell
# 스키마 변경 후
npx prisma migrate dev --name add_new_field
```

### 데이터베이스 리셋 (개발 환경만!)
```powershell
npx prisma migrate reset
```

### 프로덕션 마이그레이션
```powershell
npx prisma migrate deploy
```

## 🔄 MongoDB vs PostgreSQL

| 항목 | MongoDB | PostgreSQL |
|------|---------|------------|
| **타입** | NoSQL | Relational |
| **스키마** | 자유로움 | 엄격함 (Prisma) |
| **Railway** | ❌ 유료 | ✅ 무료 제공 |
| **JSON 필드** | Native | Prisma `Json` 타입 |
| **쿼리** | MongoDB 쿼리 | SQL (Prisma ORM) |

## ✅ 변경 사항

### 제거된 항목
- ❌ mongoose 패키지
- ❌ MongoDB 연결 코드
- ❌ User, Reading 모델 (Mongoose)

### 추가된 항목
- ✅ @prisma/client
- ✅ prisma (dev dependency)
- ✅ Prisma 스키마
- ✅ PostgreSQL 지원

### 수정된 파일
- `auth.controller.ts` - Prisma 사용
- `ai-interpretation.controller.ts` - Prisma 사용
- `index.ts` - MongoDB 연결 제거
- `.env.example` - DATABASE_URL로 변경

## 🐛 문제 해결

### "Prisma Client not generated"
```powershell
npx prisma generate
```

### "Can't reach database server"
PostgreSQL이 실행 중인지 확인:
```powershell
# Docker
docker ps

# Windows 서비스
services.msc → postgresql-x64-15
```

### "Migration failed"
```powershell
# 개발 환경: 리셋 후 재시도
npx prisma migrate reset
npx prisma migrate dev
```

### "Cannot find module '@prisma/client'"
```powershell
npm install @prisma/client
npx prisma generate
```

## 📝 Prisma 주요 명령어

```powershell
# Client 생성
npx prisma generate

# 마이그레이션 생성 및 실행
npx prisma migrate dev

# 프로덕션 마이그레이션
npx prisma migrate deploy

# Studio 실행 (GUI)
npx prisma studio

# 스키마 포맷
npx prisma format

# DB 상태 확인
npx prisma migrate status
```

## 🎉 완료!

이제 PostgreSQL + Prisma로 작동하며, Railway에 바로 배포할 수 있습니다!

**Railway 무료 플랜:**
- PostgreSQL 무료 제공
- 월 $5 상당 크레딧
- 자동 배포 및 스케일링
- 실시간 로그 및 모니터링

---

**업데이트**: 2025-10-28
**DB**: PostgreSQL 15 + Prisma ORM
**배포**: Railway Ready ✅
