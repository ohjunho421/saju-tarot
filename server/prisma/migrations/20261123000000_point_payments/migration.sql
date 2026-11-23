-- CreateTable: 포인트 충전 주문
CREATE TABLE "PaymentOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "shortfall" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable: 하루 1회 무료 리딩 사용 기록
CREATE TABLE "DailyFreeUse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spreadType" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyFreeUse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyFreeUse_userId_spreadType_day_key" ON "DailyFreeUse"("userId", "spreadType", "day");

-- AddForeignKey
ALTER TABLE "DailyFreeUse" ADD CONSTRAINT "DailyFreeUse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 이용약관·개인정보 수집·이용 동의 시각
ALTER TABLE "User" ADD COLUMN "termsAgreedAt" TIMESTAMP(3);

-- 잔액이 음수가 되는 것을 DB에서도 막는다
ALTER TABLE "User" ADD CONSTRAINT "User_points_nonnegative" CHECK ("points" >= 0);

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 유료 전환 안내 포인트: 이 시점까지 가입한 회원 모두에게 1,000포인트를 한 번 지급한다.
-- (신규 가입자는 가입 시 서버가 지급한다 — server/src/services/point.service.ts grantSignupBonus)
INSERT INTO "PointTransaction" ("id", "userId", "type", "amount", "balance", "description", "createdAt")
SELECT 'bonus_' || "id", "id", 'charge', 1000, "points" + 1000, '유료 전환 안내 포인트', CURRENT_TIMESTAMP
FROM "User";

UPDATE "User" SET "points" = "points" + 1000;
