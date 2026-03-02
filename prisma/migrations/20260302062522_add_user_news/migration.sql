-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'USER_NEWS';

-- CreateTable
CREATE TABLE "user_news" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "thumbnailId" TEXT,
    "bodyImageId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "adminHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_news_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_news_userId_sortOrder_idx" ON "user_news"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "user_news_userId_slug_key" ON "user_news"("userId", "slug");

-- AddForeignKey
ALTER TABLE "user_news" ADD CONSTRAINT "user_news_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_news" ADD CONSTRAINT "user_news_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_news" ADD CONSTRAINT "user_news_bodyImageId_fkey" FOREIGN KEY ("bodyImageId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
