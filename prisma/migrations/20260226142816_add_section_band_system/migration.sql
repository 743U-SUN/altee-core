-- AlterTable
ALTER TABLE "user_sections" ADD COLUMN     "settings" JSONB;

-- CreateTable
CREATE TABLE "section_background_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "thumbnailKey" TEXT,
    "cssString" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "section_background_presets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "section_background_presets_isActive_sortOrder_idx" ON "section_background_presets"("isActive", "sortOrder");
