-- DropForeignKey
ALTER TABLE "articles" DROP CONSTRAINT "articles_authorId_fkey";

-- DropForeignKey
ALTER TABLE "media_files" DROP CONSTRAINT "media_files_uploaderId_fkey";

-- DropIndex
DROP INDEX "faq_categories_sortOrder_idx";

-- DropIndex
DROP INDEX "faq_categories_userId_idx";

-- DropIndex
DROP INDEX "faq_questions_categoryId_idx";

-- DropIndex
DROP INDEX "faq_questions_sortOrder_idx";

-- DropIndex
DROP INDEX "user_news_userId_sortOrder_idx";

-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "media_files" ALTER COLUMN "uploaderId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "articles_authorId_idx" ON "articles"("authorId");

-- CreateIndex
CREATE INDEX "articles_thumbnailId_idx" ON "articles"("thumbnailId");

-- CreateIndex
CREATE INDEX "faq_categories_userId_sortOrder_idx" ON "faq_categories"("userId", "sortOrder");

-- CreateIndex
CREATE INDEX "faq_questions_categoryId_sortOrder_idx" ON "faq_questions"("categoryId", "sortOrder");

-- CreateIndex
CREATE INDEX "user_news_userId_published_sortOrder_idx" ON "user_news"("userId", "published", "sortOrder");

-- CreateIndex
CREATE INDEX "user_news_thumbnailId_idx" ON "user_news"("thumbnailId");

-- CreateIndex
CREATE INDEX "user_news_bodyImageId_idx" ON "user_news"("bodyImageId");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitch_eventsub_subscriptions" ADD CONSTRAINT "twitch_eventsub_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
