-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('SELECT', 'NUMBER', 'TEXT', 'BOOLEAN');

-- CreateTable
CREATE TABLE "device_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "category_attributes" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "unit" TEXT,
    "options" JSONB,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" TEXT NOT NULL,
    "asin" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT NOT NULL,
    "amazonUrl" TEXT NOT NULL,
    "amazonImageUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "review" TEXT,
    "rating" INTEGER,
    "purchaseDate" TIMESTAMP(3),
    "pricePaid" INTEGER,
    "usageDuration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_attributes" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "categoryAttributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_attributes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_categories_name_key" ON "device_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "device_categories_slug_key" ON "device_categories"("slug");

-- CreateIndex
CREATE INDEX "device_categories_sortOrder_idx" ON "device_categories"("sortOrder");

-- CreateIndex
CREATE INDEX "category_attributes_categoryId_idx" ON "category_attributes"("categoryId");

-- CreateIndex
CREATE INDEX "category_attributes_sortOrder_idx" ON "category_attributes"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "devices_asin_key" ON "devices"("asin");

-- CreateIndex
CREATE INDEX "devices_asin_idx" ON "devices"("asin");

-- CreateIndex
CREATE INDEX "devices_categoryId_idx" ON "devices"("categoryId");

-- CreateIndex
CREATE INDEX "devices_createdAt_idx" ON "devices"("createdAt");

-- CreateIndex
CREATE INDEX "user_devices_userId_idx" ON "user_devices"("userId");

-- CreateIndex
CREATE INDEX "user_devices_deviceId_idx" ON "user_devices"("deviceId");

-- CreateIndex
CREATE INDEX "user_devices_isPublic_idx" ON "user_devices"("isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "user_devices_userId_deviceId_key" ON "user_devices"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "device_attributes_deviceId_idx" ON "device_attributes"("deviceId");

-- CreateIndex
CREATE INDEX "device_attributes_categoryAttributeId_idx" ON "device_attributes"("categoryAttributeId");

-- CreateIndex
CREATE UNIQUE INDEX "device_attributes_deviceId_categoryAttributeId_key" ON "device_attributes"("deviceId", "categoryAttributeId");

-- AddForeignKey
ALTER TABLE "category_attributes" ADD CONSTRAINT "category_attributes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "device_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "device_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_attributes" ADD CONSTRAINT "device_attributes_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_attributes" ADD CONSTRAINT "device_attributes_categoryAttributeId_fkey" FOREIGN KEY ("categoryAttributeId") REFERENCES "category_attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
