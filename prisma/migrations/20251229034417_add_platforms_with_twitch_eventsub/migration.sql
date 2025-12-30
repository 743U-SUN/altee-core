-- AlterTable
ALTER TABLE "users" ADD COLUMN     "livePriority" TEXT NOT NULL DEFAULT 'youtube',
ADD COLUMN     "twitchUserId" TEXT,
ADD COLUMN     "twitchUsername" TEXT,
ADD COLUMN     "youtubeChannelId" TEXT,
ADD COLUMN     "youtubeRssFeedLimit" INTEGER NOT NULL DEFAULT 6;

-- CreateTable
CREATE TABLE "youtube_recommended_videos" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT,
    "thumbnail" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_recommended_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitch_live_status" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "streamId" TEXT,
    "streamTitle" TEXT,
    "streamThumbnail" TEXT,
    "viewerCount" INTEGER,
    "startedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "twitch_live_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitch_eventsub_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "twitch_eventsub_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "youtube_recommended_videos_userId_sortOrder_idx" ON "youtube_recommended_videos"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "youtube_recommended_videos_userId_videoId_key" ON "youtube_recommended_videos"("userId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "twitch_live_status_userId_key" ON "twitch_live_status"("userId");

-- CreateIndex
CREATE INDEX "twitch_live_status_isLive_idx" ON "twitch_live_status"("isLive");

-- CreateIndex
CREATE UNIQUE INDEX "twitch_eventsub_subscriptions_subscriptionId_key" ON "twitch_eventsub_subscriptions"("subscriptionId");

-- CreateIndex
CREATE INDEX "twitch_eventsub_subscriptions_userId_idx" ON "twitch_eventsub_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "twitch_eventsub_subscriptions_subscriptionId_idx" ON "twitch_eventsub_subscriptions"("subscriptionId");

-- CreateIndex
CREATE INDEX "users_youtubeChannelId_idx" ON "users"("youtubeChannelId");

-- CreateIndex
CREATE INDEX "users_twitchUserId_idx" ON "users"("twitchUserId");

-- AddForeignKey
ALTER TABLE "youtube_recommended_videos" ADD CONSTRAINT "youtube_recommended_videos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "twitch_live_status" ADD CONSTRAINT "twitch_live_status_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
