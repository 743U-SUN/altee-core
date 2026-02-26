-- Step 1: Add new columns
ALTER TABLE "user_profiles" ADD COLUMN "characterImageId" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN "avatarImageId" TEXT;

-- Step 2: Copy existing profileImageId to characterImageId
UPDATE "user_profiles" SET "characterImageId" = "profileImageId" WHERE "profileImageId" IS NOT NULL;

-- Step 3: Drop old foreign key
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_profileImageId_fkey";

-- Step 4: Drop old column
ALTER TABLE "user_profiles" DROP COLUMN "profileImageId";

-- Step 5: Add new foreign keys
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_characterImageId_fkey" FOREIGN KEY ("characterImageId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_avatarImageId_fkey" FOREIGN KEY ("avatarImageId") REFERENCES "media_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
