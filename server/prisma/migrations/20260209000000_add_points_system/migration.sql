-- AlterTable: User에 포인트 컬럼 추가
ALTER TABLE "User" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: Reading에 궁합 리딩 컬럼 추가
ALTER TABLE "Reading" ADD COLUMN "compatibilityReading" TEXT;

-- CreateTable: 포인트 거래 내역
CREATE TABLE "PointTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "orderId" TEXT,
    "readingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointTransaction_userId_createdAt_idx" ON "PointTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PointTransaction_orderId_idx" ON "PointTransaction"("orderId");

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
