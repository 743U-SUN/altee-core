-- CreateTable
CREATE TABLE "user_gifts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "imageId" TEXT,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_gifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_gifts_userId_key" ON "user_gifts"("userId");

-- CreateIndex
CREATE INDEX "user_gifts_userId_idx" ON "user_gifts"("userId");

-- AddForeignKey
ALTER TABLE "user_gifts" ADD CONSTRAINT "user_gifts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_gifts" ADD CONSTRAINT "user_gifts_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
