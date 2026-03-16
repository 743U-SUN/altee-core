-- DropForeignKey
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_avatarImageId_fkey";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "avatarImageId";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "characterName",
DROP COLUMN "customImageKey",
DROP COLUMN "preferredImageProvider";
