-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'LINK_ICON';

-- CreateTable
CREATE TABLE "link_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "defaultIcon" TEXT,
    "urlPattern" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "linkTypeId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "customLabel" TEXT,
    "customIconId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "link_types_name_key" ON "link_types"("name");

-- CreateIndex
CREATE INDEX "link_types_isActive_idx" ON "link_types"("isActive");

-- CreateIndex
CREATE INDEX "link_types_sortOrder_idx" ON "link_types"("sortOrder");

-- CreateIndex
CREATE INDEX "user_links_userId_idx" ON "user_links"("userId");

-- CreateIndex
CREATE INDEX "user_links_sortOrder_idx" ON "user_links"("sortOrder");

-- AddForeignKey
ALTER TABLE "user_links" ADD CONSTRAINT "user_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_links" ADD CONSTRAINT "user_links_linkTypeId_fkey" FOREIGN KEY ("linkTypeId") REFERENCES "link_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_links" ADD CONSTRAINT "user_links_customIconId_fkey" FOREIGN KEY ("customIconId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
