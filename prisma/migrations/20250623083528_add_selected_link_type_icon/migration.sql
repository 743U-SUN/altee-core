-- AlterTable
ALTER TABLE "user_links" ADD COLUMN     "selectedLinkTypeIconId" TEXT;

-- AddForeignKey
ALTER TABLE "user_links" ADD CONSTRAINT "user_links_selectedLinkTypeIconId_fkey" FOREIGN KEY ("selectedLinkTypeIconId") REFERENCES "link_type_icons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
