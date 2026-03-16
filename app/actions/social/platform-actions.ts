"use server"

import { prisma } from "@/lib/prisma"
import { fetchYoutubeRssFeed } from "@/services/youtube/youtube-api"

// =============================================================================
// 汎用ユーザー取得
// =============================================================================

/**
 * handleでユーザーを取得
 */
export async function getUserByHandle(handle: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { handle },
      select: {
        id: true,
        handle: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        characterInfo: {
          select: { characterName: true, iconImageKey: true },
        },
      },
    })

    return user
  } catch (error) {
    console.error("ユーザー取得エラー:", error)
    return null
  }
}

// =============================================================================
// 公開API - ライブ配信・動画取得
// =============================================================================

/**
 * 現在のライブ配信を取得（優先度考慮）
 */
export async function getCurrentLiveStream(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeChannelId: true,
        twitchUsername: true,
        livePriority: true,
        twitchLiveStatus: true,
      },
    })

    if (!user) {
      return null
    }

    // Twitch Live状態チェック
    const isTwitchLive = user.twitchLiveStatus?.isLive ?? false

    // Twitch優先 かつ Twitchがライブ中の場合
    if (user.livePriority === "twitch" && isTwitchLive && user.twitchUsername) {
      return {
        platform: "twitch" as const,
        twitchUsername: user.twitchUsername,
        streamTitle: user.twitchLiveStatus?.streamTitle ?? null,
        viewerCount: user.twitchLiveStatus?.viewerCount ?? null,
        isLive: true,
      }
    }

    // Twitchがライブ中の場合（YouTube優先でもTwitchライブがあれば表示）
    if (isTwitchLive && user.twitchUsername) {
      return {
        platform: "twitch" as const,
        twitchUsername: user.twitchUsername,
        streamTitle: user.twitchLiveStatus?.streamTitle ?? null,
        viewerCount: user.twitchLiveStatus?.viewerCount ?? null,
        isLive: true,
      }
    }

    // YouTube最新動画を取得（ライブ検出なし、単に最新動画を表示）
    if (user.youtubeChannelId) {
      const rssResult = await fetchYoutubeRssFeed(user.youtubeChannelId, 1)
      if (rssResult.success && rssResult.data && rssResult.data.length > 0) {
        const latestVideo = rssResult.data[0]
        return {
          platform: "youtube" as const,
          videoId: latestVideo.videoId,
          isLive: false,
        }
      }
    }

    return null
  } catch (error) {
    console.error("ライブ配信取得エラー:", error)
    return null
  }
}

/**
 * トップおすすめ動画を取得
 */
export async function getTopRecommendedVideo(userId: string) {
  try {
    const video = await prisma.youTubeRecommendedVideo.findFirst({
      where: {
        userId,
        isVisible: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    })

    if (!video) {
      return null
    }

    return {
      platform: "youtube" as const,
      videoId: video.videoId,
      isLive: false,
    }
  } catch (error) {
    console.error("おすすめ動画取得エラー:", error)
    return null
  }
}

/**
 * ユーザーのおすすめ動画を取得
 */
export async function getUserRecommendedVideos(userId: string) {
  try {
    const videos = await prisma.youTubeRecommendedVideo.findMany({
      where: {
        userId,
        isVisible: true,
      },
      orderBy: { sortOrder: "asc" },
    })

    return { success: true, data: videos }
  } catch (error) {
    console.error("おすすめ動画取得エラー:", error)
    return { success: false, error: "おすすめ動画の取得に失敗しました", data: [] }
  }
}

/**
 * YouTube RSS Feedを取得（公開API用）
 * Service層の関数を直接呼び出します
 */
export { fetchYoutubeRssFeed }
