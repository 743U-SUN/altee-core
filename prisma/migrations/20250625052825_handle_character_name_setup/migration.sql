/*
  Warnings:

  - You are about to drop the column `displayName` on the `user_profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[handle]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "displayName";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "characterName" TEXT,
ADD COLUMN     "handle" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_handle_key" ON "users"("handle");

-- CreateIndex
CREATE INDEX "users_handle_idx" ON "users"("handle");
