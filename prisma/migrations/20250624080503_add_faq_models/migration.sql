-- CreateTable
CREATE TABLE "faq_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_questions" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "faq_categories_userId_idx" ON "faq_categories"("userId");

-- CreateIndex
CREATE INDEX "faq_categories_sortOrder_idx" ON "faq_categories"("sortOrder");

-- CreateIndex
CREATE INDEX "faq_questions_categoryId_idx" ON "faq_questions"("categoryId");

-- CreateIndex
CREATE INDEX "faq_questions_sortOrder_idx" ON "faq_questions"("sortOrder");

-- AddForeignKey
ALTER TABLE "faq_categories" ADD CONSTRAINT "faq_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_questions" ADD CONSTRAINT "faq_questions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "faq_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
