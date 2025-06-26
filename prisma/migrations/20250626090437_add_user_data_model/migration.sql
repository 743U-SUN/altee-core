-- CreateTable
CREATE TABLE "user_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_data_userId_idx" ON "user_data"("userId");

-- CreateIndex
CREATE INDEX "user_data_sortOrder_idx" ON "user_data"("sortOrder");

-- AddForeignKey
ALTER TABLE "user_data" ADD CONSTRAINT "user_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
