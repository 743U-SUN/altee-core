-- CreateTable
CREATE TABLE "link_type_icons" (
    "id" TEXT NOT NULL,
    "linkTypeId" TEXT NOT NULL,
    "iconKey" TEXT NOT NULL,
    "iconName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_type_icons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "link_type_icons_linkTypeId_idx" ON "link_type_icons"("linkTypeId");

-- CreateIndex
CREATE INDEX "link_type_icons_sortOrder_idx" ON "link_type_icons"("sortOrder");

-- AddForeignKey
ALTER TABLE "link_type_icons" ADD CONSTRAINT "link_type_icons_linkTypeId_fkey" FOREIGN KEY ("linkTypeId") REFERENCES "link_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
