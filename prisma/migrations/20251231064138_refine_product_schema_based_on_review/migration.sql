/*
  Warnings:

  - You are about to drop the column `categoryType` on the `product_categories` table. All the data in the column will be lost.
  - You are about to drop the column `productType` on the `products` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "product_categories_categoryType_idx";

-- DropIndex
DROP INDEX "products_productType_idx";

-- AlterTable
ALTER TABLE "product_categories" DROP COLUMN "categoryType",
ADD COLUMN     "requiresCompatibilityCheck" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "productType";

-- DropEnum
DROP TYPE "CategoryType";

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");
