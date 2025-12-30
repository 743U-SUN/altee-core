"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { fetchYoutubeVideoMetadata, getYoutubeThumbnailUrl, fetchYoutubeRssFeed } from "@/services/youtube/youtube-api"
import { subscribeToYoutubePush, unsubscribeFromYoutubePush } from "@/services/youtube/youtube-pubsubhubbub"
import {
  MAX_RECOMMENDED_VIDEOS,
  MAX_RSS_FEED_LIMIT,
  DEFAULT_RSS_FEED_LIMIT,
  YOUTUBE_CHANNEL_ID_PATTERN,
  YOUTUBE_VIDEO_ID_PATTERN
} from "@/constants/platform"

// =============================================================================
// バリデーションスキーマ
// =============================================================================

// YouTube Channel設定スキーマ
const youtubeChannelSchema = z.object({
  channelId: z.string().regex(YOUTUBE_CHANNEL_ID_PATTERN, "有効なYouTube Channel IDではありません"),
  rssFeedLimit: z.number().min(0).max(MAX_RSS_FEED_LIMIT).default(DEFAULT_RSS_FEED_LIMIT),
})

// おすすめ動画追加スキーマ
const recommendedVideoSchema = z.object({
  videoId: z.string().regex(YOUTUBE_VIDEO_ID_PATTERN, "有効なYouTube Video IDではありません"),
})

// 並び替えスキーマ
const reorderVideosSchema = z.object({
  videoIds: z.array(z.string()).min(1, "並び替える動画が必要です"),
})

// =============================================================================
// YouTube Channel 設定
// =============================================================================

/**
 * URLからYouTube Channel IDを抽出
 */
export async function extractChannelIdFromUrl(url: string): Promise<{
  success: boolean
  channelId?: string
  error?: string
}> {
  try {
    // すでにChannel IDの形式ならそのまま返す
    if (YOUTUBE_CHANNEL_ID_PATTERN.test(url)) {
      return { success: true, channelId: url }
    }

    // URL形式の場合、パターンマッチング
    const patterns = [
      /youtube\.com\/channel\/(UC[\w-]{22})/,
      /youtube\.com\/c\/([\w-]+)/,
      /youtube\.com\/@([\w-]+)/,
      /youtube\.com\/user\/([\w-]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        // channel/UC... の場合は直接ID
        if (pattern.source.includes('channel')) {
          return { success: true, channelId: match[1] }
        }
        // それ以外は、YouTube Data APIが必要（将来実装）
        return {
          success: false,
          error: "このURL形式は現在サポートされていません。Channel ID (UC...)を直接入力してください"
        }
      }
    }

    return { success: false, error: "有効なYouTube URLまたはChannel IDではありません" }
  } catch {
    return { success: false, error: "URL解析中にエラーが発生しました" }
  }
}

/**
 * YouTube Channel設定を更新
 */
export async function updateYoutubeChannel(data: z.infer<typeof youtubeChannelSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const validatedData = youtubeChannelSchema.parse(data)

    // Get current channel ID to check if it changed
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { youtubeChannelId: true },
    })

    const channelChanged = currentUser?.youtubeChannelId !== validatedData.channelId

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        youtubeChannelId: validatedData.channelId,
        youtubeRssFeedLimit: validatedData.rssFeedLimit,
      },
    })

    // Subscribe to PubSubHubbub if channel changed
    if (channelChanged && validatedData.channelId) {
      // Unsubscribe from old channel if exists
      if (currentUser?.youtubeChannelId) {
        await unsubscribeFromYoutubePush(currentUser.youtubeChannelId)
      }
      // Subscribe to new channel
      await subscribeToYoutubePush(validatedData.channelId)
    }

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("YouTube Channel更新エラー:", error)
    return { success: false, error: "YouTube Channel設定の更新に失敗しました" }
  }
}

// =============================================================================
// おすすめ動画管理
// =============================================================================

/**
 * おすすめ動画を追加
 */
export async function addRecommendedVideo(videoUrl: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // URLから Video ID を抽出
    let videoId = videoUrl
    const patterns = [
      /youtube\.com\/watch\?v=([\w-]{11})/,
      /youtu\.be\/([\w-]{11})/,
      /youtube\.com\/embed\/([\w-]{11})/,
    ]

    for (const pattern of patterns) {
      const match = videoUrl.match(pattern)
      if (match) {
        videoId = match[1]
        break
      }
    }

    // Video ID検証
    const validatedData = recommendedVideoSchema.parse({ videoId })

    // 最大本数チェック
    const existingCount = await prisma.youTubeRecommendedVideo.count({
      where: { userId: session.user.id }
    })

    if (existingCount >= MAX_RECOMMENDED_VIDEOS) {
      return { success: false, error: `おすすめ動画は最大${MAX_RECOMMENDED_VIDEOS}本まで設定できます` }
    }

    // 重複チェック
    const existing = await prisma.youTubeRecommendedVideo.findUnique({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId: validatedData.videoId
        }
      }
    })

    if (existing) {
      return { success: false, error: "この動画は既に追加されています" }
    }

    // YouTube oEmbed APIから動画メタデータを取得
    const metadataResult = await fetchYoutubeVideoMetadata(validatedData.videoId)

    let title: string | null = null
    let thumbnail: string | null = null

    if (metadataResult.success) {
      title = metadataResult.title || null
      thumbnail = metadataResult.thumbnail || null
    }

    // フォールバック: サムネイルURLを構築
    if (!thumbnail) {
      thumbnail = getYoutubeThumbnailUrl(validatedData.videoId)
    }

    // 現在の最大sortOrderを取得
    const maxSortOrder = await prisma.youTubeRecommendedVideo.findFirst({
      where: { userId: session.user.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true }
    })

    const newSortOrder = (maxSortOrder?.sortOrder ?? -1) + 1

    const video = await prisma.youTubeRecommendedVideo.create({
      data: {
        userId: session.user.id,
        videoId: validatedData.videoId,
        title,
        thumbnail,
        sortOrder: newSortOrder,
      },
    })

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true, data: video }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("おすすめ動画追加エラー:", error)
    return { success: false, error: "おすすめ動画の追加に失敗しました" }
  }
}

/**
 * おすすめ動画を削除
 */
export async function deleteRecommendedVideo(id: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 所有権チェック
    const video = await prisma.youTubeRecommendedVideo.findUnique({
      where: { id },
    })

    if (!video || video.userId !== session.user.id) {
      return { success: false, error: "動画が見つかりません" }
    }

    await prisma.youTubeRecommendedVideo.delete({
      where: { id },
    })

    // sortOrderの再採番
    const remainingVideos = await prisma.youTubeRecommendedVideo.findMany({
      where: { userId: session.user.id },
      orderBy: { sortOrder: "asc" }
    })

    await Promise.all(
      remainingVideos.map((video, index) =>
        prisma.youTubeRecommendedVideo.update({
          where: { id: video.id },
          data: { sortOrder: index }
        })
      )
    )

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true }
  } catch (error) {
    console.error("おすすめ動画削除エラー:", error)
    return { success: false, error: "おすすめ動画の削除に失敗しました" }
  }
}

/**
 * おすすめ動画を並び替え
 */
export async function reorderRecommendedVideos(data: z.infer<typeof reorderVideosSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const validatedData = reorderVideosSchema.parse(data)

    // 所有権チェック
    const videos = await prisma.youTubeRecommendedVideo.findMany({
      where: {
        id: { in: validatedData.videoIds },
        userId: session.user.id
      }
    })

    if (videos.length !== validatedData.videoIds.length) {
      return { success: false, error: "動画が見つかりません" }
    }

    // 並び替え実行
    await Promise.all(
      validatedData.videoIds.map((id, index) =>
        prisma.youTubeRecommendedVideo.update({
          where: { id },
          data: { sortOrder: index }
        })
      )
    )

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("おすすめ動画並び替えエラー:", error)
    return { success: false, error: "おすすめ動画の並び替えに失敗しました" }
  }
}

/**
 * おすすめ動画の表示/非表示を切り替え
 */
export async function toggleRecommendedVideosVisibility(isVisible: boolean) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    await prisma.youTubeRecommendedVideo.updateMany({
      where: { userId: session.user.id },
      data: { isVisible }
    })

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true }
  } catch (error) {
    console.error("おすすめ動画表示切替エラー:", error)
    return { success: false, error: "表示設定の更新に失敗しました" }
  }
}

// =============================================================================
// データ取得
// =============================================================================

/**
 * 現在のユーザーのRSS Feed動画を取得（Dashboard用）
 */
export async function getMyRssFeedVideos() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        youtubeChannelId: true,
        youtubeRssFeedLimit: true,
      },
    })

    if (!user?.youtubeChannelId || user.youtubeRssFeedLimit === 0) {
      return { success: true, data: [] }
    }

    return await fetchYoutubeRssFeed(user.youtubeChannelId, user.youtubeRssFeedLimit)
  } catch (error) {
    console.error("RSS Feed取得エラー:", error)
    return { success: false, error: "RSS Feedの取得に失敗しました" }
  }
}

/**
 * ユーザーのYouTube設定を取得
 */
export async function getUserYoutubeSettings() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        youtubeChannelId: true,
        youtubeRssFeedLimit: true,
        youtubeRecommendedVideos: {
          orderBy: { sortOrder: "asc" }
        }
      },
    })

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error("YouTube設定取得エラー:", error)
    return { success: false, error: "YouTube設定の取得に失敗しました" }
  }
}
