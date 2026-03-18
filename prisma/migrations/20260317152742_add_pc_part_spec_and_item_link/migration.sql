-- AlterTable
ALTER TABLE "user_pc_build_parts" ADD COLUMN     "itemId" TEXT;

-- CreateTable
CREATE TABLE "pc_part_specs" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "partType" "pc_part_type" NOT NULL,
    "chipMakerId" TEXT,
    "tdp" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "specs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pc_part_specs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pc_part_specs_itemId_key" ON "pc_part_specs"("itemId");

-- CreateIndex
CREATE INDEX "pc_part_specs_partType_idx" ON "pc_part_specs"("partType");

-- CreateIndex
CREATE INDEX "pc_part_specs_chipMakerId_idx" ON "pc_part_specs"("chipMakerId");

-- CreateIndex
CREATE INDEX "user_pc_build_parts_itemId_idx" ON "user_pc_build_parts"("itemId");

-- AddForeignKey
ALTER TABLE "user_pc_build_parts" ADD CONSTRAINT "user_pc_build_parts_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_part_specs" ADD CONSTRAINT "pc_part_specs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pc_part_specs" ADD CONSTRAINT "pc_part_specs_chipMakerId_fkey" FOREIGN KEY ("chipMakerId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
