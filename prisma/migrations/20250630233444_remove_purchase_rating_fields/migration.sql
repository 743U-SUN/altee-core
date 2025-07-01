/*
  Warnings:

  - You are about to drop the column `pricePaid` on the `user_devices` table. All the data in the column will be lost.
  - You are about to drop the column `purchaseDate` on the `user_devices` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `user_devices` table. All the data in the column will be lost.
  - You are about to drop the column `usageDuration` on the `user_devices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user_devices" DROP COLUMN "pricePaid",
DROP COLUMN "purchaseDate",
DROP COLUMN "rating",
DROP COLUMN "usageDuration";
