/*
  Warnings:

  - You are about to drop the `user_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_links` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_data" DROP CONSTRAINT "user_data_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_links" DROP CONSTRAINT "user_links_customIconId_fkey";

-- DropForeignKey
ALTER TABLE "user_links" DROP CONSTRAINT "user_links_linkTypeId_fkey";

-- DropForeignKey
ALTER TABLE "user_links" DROP CONSTRAINT "user_links_selectedLinkTypeIconId_fkey";

-- DropForeignKey
ALTER TABLE "user_links" DROP CONSTRAINT "user_links_userId_fkey";

-- DropTable
DROP TABLE "user_data";

-- DropTable
DROP TABLE "user_links";
