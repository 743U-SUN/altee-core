-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SELF', 'MANAGED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'SELF',
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "managedBy" TEXT;

-- CreateIndex
CREATE INDEX "users_accountType_idx" ON "users"("accountType");
