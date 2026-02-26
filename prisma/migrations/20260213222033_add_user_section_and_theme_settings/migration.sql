-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "bannerImageKey" TEXT,
ADD COLUMN     "themePreset" TEXT DEFAULT 'claymorphic',
ADD COLUMN     "themeSettings" JSONB;

-- CreateTable
CREATE TABLE "user_sections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "title" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_sections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_sections_userId_sortOrder_idx" ON "user_sections"("userId", "sortOrder");

-- AddForeignKey
ALTER TABLE "user_sections" ADD CONSTRAINT "user_sections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
