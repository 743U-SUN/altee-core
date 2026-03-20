-- AlterTable
ALTER TABLE "user_sections" ADD COLUMN     "page" TEXT NOT NULL DEFAULT 'profile';

-- CreateIndex
CREATE INDEX "user_sections_userId_page_sortOrder_idx" ON "user_sections"("userId", "page", "sortOrder");
