-- 카카오 로그인: 이메일·비밀번호 없이 가입할 수 있게 하고 카카오 회원번호를 저장한다
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "kakaoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoId_key" ON "User"("kakaoId");
