-- AlterEnum
ALTER TYPE "MediaType" ADD VALUE 'SYSTEM';

-- AlterTable
ALTER TABLE "media_files" ADD COLUMN     "altText" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "tags" JSONB;
