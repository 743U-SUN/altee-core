/*
  Warnings:

  - You are about to drop the column `backgroundImageId` on the `user_profiles` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_backgroundImageId_fkey";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "backgroundImageId",
ADD COLUMN     "backgroundImageKey" TEXT;
