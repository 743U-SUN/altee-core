-- CreateTable
CREATE TABLE "character_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "iconImageKey" TEXT,
    "characterName" TEXT,
    "nameReading" TEXT,
    "gender" TEXT,
    "birthdayMonth" INTEGER,
    "birthdayDay" INTEGER,
    "species" TEXT,
    "element" TEXT,
    "debutDate" TIMESTAMP(3),
    "fanName" TEXT,
    "fanMark" TEXT,
    "illustrator" TEXT,
    "modeler" TEXT,
    "affiliation" TEXT,
    "affiliationType" TEXT,
    "streamingStyles" TEXT[],
    "streamingTimezones" TEXT[],
    "streamingFrequency" TEXT,
    "languages" TEXT[],
    "activityStatus" TEXT,
    "gamePlatforms" TEXT[],
    "gameGenres" TEXT[],
    "nowPlaying" TEXT,
    "collabStatus" TEXT,
    "collabComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_platform_accounts" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "character_platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "character_info_userId_key" ON "character_info"("userId");

-- CreateIndex
CREATE INDEX "character_info_gender_idx" ON "character_info"("gender");

-- CreateIndex
CREATE INDEX "character_info_species_idx" ON "character_info"("species");

-- CreateIndex
CREATE INDEX "character_info_element_idx" ON "character_info"("element");

-- CreateIndex
CREATE INDEX "character_info_collabStatus_idx" ON "character_info"("collabStatus");

-- CreateIndex
CREATE INDEX "character_info_affiliationType_idx" ON "character_info"("affiliationType");

-- CreateIndex
CREATE INDEX "character_info_activityStatus_idx" ON "character_info"("activityStatus");

-- CreateIndex
CREATE INDEX "character_platform_accounts_platform_idx" ON "character_platform_accounts"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "character_platform_accounts_characterId_platform_key" ON "character_platform_accounts"("characterId", "platform");

-- AddForeignKey
ALTER TABLE "character_info" ADD CONSTRAINT "character_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_platform_accounts" ADD CONSTRAINT "character_platform_accounts_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "character_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
