-- CreateEnum
CREATE TYPE "pc_part_type" AS ENUM ('CPU', 'GPU', 'MOTHERBOARD', 'RAM', 'STORAGE', 'PSU', 'CASE', 'COOLER', 'OTHER');

-- CreateTable
CREATE TABLE "user_pc_builds" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "imageKey" TEXT,
    "description" TEXT,
    "totalBudget" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pc_builds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_pc_build_parts" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "partType" "pc_part_type" NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER,
    "amazonUrl" TEXT,
    "memo" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pc_build_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_pc_builds_userId_key" ON "user_pc_builds"("userId");

-- CreateIndex
CREATE INDEX "user_pc_build_parts_buildId_sortOrder_idx" ON "user_pc_build_parts"("buildId", "sortOrder");

-- AddForeignKey
ALTER TABLE "user_pc_builds" ADD CONSTRAINT "user_pc_builds_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_pc_build_parts" ADD CONSTRAINT "user_pc_build_parts_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "user_pc_builds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
