-- AlterTable
ALTER TABLE "user_devices" ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "user_devices_sortOrder_idx" ON "user_devices"("sortOrder");
