-- AlterTable
ALTER TABLE "media_files" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "scheduledDeletionAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "media_files_deletedAt_idx" ON "media_files"("deletedAt");
