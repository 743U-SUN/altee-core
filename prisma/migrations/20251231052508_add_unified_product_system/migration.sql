/*
  Warnings:

  - You are about to drop the column `price` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[asin]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PC_PART', 'PERIPHERAL', 'FOOD', 'BOOK', 'MICROPHONE', 'GENERAL');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PC_PART', 'PERIPHERAL', 'FOOD', 'GENERAL');

-- AlterTable
ALTER TABLE "products" DROP COLUMN "price",
ADD COLUMN     "amazonImageUrl" TEXT,
ADD COLUMN     "amazonUrl" TEXT,
ADD COLUMN     "asin" TEXT,
ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "customImageUrl" TEXT,
ADD COLUMN     "imageStorageKey" TEXT,
ADD COLUMN     "ogDescription" TEXT,
ADD COLUMN     "ogTitle" TEXT,
ADD COLUMN     "productType" "ProductType" NOT NULL DEFAULT 'GENERAL';

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "productType" "ProductType" NOT NULL DEFAULT 'GENERAL',
    "categoryType" "CategoryType" NOT NULL DEFAULT 'GENERAL',
    "icon" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_products" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "review" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");

-- CreateIndex
CREATE INDEX "product_categories_productType_idx" ON "product_categories"("productType");

-- CreateIndex
CREATE INDEX "product_categories_categoryType_idx" ON "product_categories"("categoryType");

-- CreateIndex
CREATE INDEX "product_categories_sortOrder_idx" ON "product_categories"("sortOrder");

-- CreateIndex
CREATE INDEX "user_products_userId_idx" ON "user_products"("userId");

-- CreateIndex
CREATE INDEX "user_products_productId_idx" ON "user_products"("productId");

-- CreateIndex
CREATE INDEX "user_products_isPublic_idx" ON "user_products"("isPublic");

-- CreateIndex
CREATE INDEX "user_products_sortOrder_idx" ON "user_products"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "user_products_userId_productId_key" ON "user_products"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "products_asin_key" ON "products"("asin");

-- CreateIndex
CREATE INDEX "products_productType_idx" ON "products"("productType");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "product_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_products" ADD CONSTRAINT "user_products_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_products" ADD CONSTRAINT "user_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
