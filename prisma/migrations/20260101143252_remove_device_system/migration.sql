/*
  Warnings:

  - You are about to drop the `category_attributes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_attributes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `device_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `devices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `product_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_devices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_products` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('PC_PART', 'PERIPHERAL', 'FOOD', 'BOOK', 'MICROPHONE', 'GENERAL');

-- DropForeignKey
ALTER TABLE "category_attributes" DROP CONSTRAINT "category_attributes_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "device_attributes" DROP CONSTRAINT "device_attributes_categoryAttributeId_fkey";

-- DropForeignKey
ALTER TABLE "device_attributes" DROP CONSTRAINT "device_attributes_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_brandId_fkey";

-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_parentId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_brandId_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "user_devices" DROP CONSTRAINT "user_devices_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "user_devices" DROP CONSTRAINT "user_devices_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_products" DROP CONSTRAINT "user_products_productId_fkey";

-- DropForeignKey
ALTER TABLE "user_products" DROP CONSTRAINT "user_products_userId_fkey";

-- DropTable
DROP TABLE "category_attributes";

-- DropTable
DROP TABLE "device_attributes";

-- DropTable
DROP TABLE "device_categories";

-- DropTable
DROP TABLE "devices";

-- DropTable
DROP TABLE "product_categories";

-- DropTable
DROP TABLE "products";

-- DropTable
DROP TABLE "user_devices";

-- DropTable
DROP TABLE "user_products";

-- DropEnum
DROP TYPE "AttributeType";

-- DropEnum
DROP TYPE "ProductType";

-- CreateTable
CREATE TABLE "item_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "itemType" "ItemType" NOT NULL DEFAULT 'GENERAL',
    "requiresCompatibilityCheck" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "brandId" TEXT,
    "amazonUrl" TEXT,
    "amazonImageUrl" TEXT,
    "customImageUrl" TEXT,
    "imageStorageKey" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "asin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "review" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_categories_slug_key" ON "item_categories"("slug");

-- CreateIndex
CREATE INDEX "item_categories_itemType_idx" ON "item_categories"("itemType");

-- CreateIndex
CREATE INDEX "item_categories_sortOrder_idx" ON "item_categories"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "items_asin_key" ON "items"("asin");

-- CreateIndex
CREATE INDEX "items_categoryId_idx" ON "items"("categoryId");

-- CreateIndex
CREATE INDEX "items_brandId_idx" ON "items"("brandId");

-- CreateIndex
CREATE INDEX "items_createdAt_idx" ON "items"("createdAt");

-- CreateIndex
CREATE INDEX "user_items_userId_idx" ON "user_items"("userId");

-- CreateIndex
CREATE INDEX "user_items_itemId_idx" ON "user_items"("itemId");

-- CreateIndex
CREATE INDEX "user_items_isPublic_idx" ON "user_items"("isPublic");

-- CreateIndex
CREATE INDEX "user_items_sortOrder_idx" ON "user_items"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "user_items_userId_itemId_key" ON "user_items"("userId", "itemId");

-- AddForeignKey
ALTER TABLE "item_categories" ADD CONSTRAINT "item_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "item_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "item_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_items" ADD CONSTRAINT "user_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
