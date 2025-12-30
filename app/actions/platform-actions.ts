"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { XMLParser } from "fast-xml-parser"

// =============================================================================
// ユーザー取得
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
        characterName: true,
        email: true,
        image: true,
        customImageKey: true,
        createdAt: true,
      },
    })

    return user
  } catch (error) {
    console.error("ユーザー取得エラー:", error)
    return null
  }
}

// =============================================================================
// バリデーションスキーマ
// =============================================================================

// YouTube Channel ID: UC + 22文字の英数字とハイフン・アンダースコア
const youtubeChannelIdSchema = z.string().regex(/^UC[\w-]{22}$/, "有効なYouTube Channel IDではありません")

// YouTube Video ID: 11文字の英数字とハイフン・アンダースコア
const youtubeVideoIdSchema = z.string().regex(/^[\w-]{11}$/, "有効なYouTube Video IDではありません")

// Twitch Username: 英数字とアンダースコアのみ（4-25文字）
const twitchUsernameSchema = z.string().regex(/^[a-zA-Z0-9_]{4,25}$/, "有効なTwitch Usernameではありません")

// YouTube Channel設定スキーマ
const youtubeChannelSchema = z.object({
  channelId: youtubeChannelIdSchema,
  rssFeedLimit: z.number().min(0).max(15).default(6), // 0も許可（非表示用）
})

// おすすめ動画追加スキーマ
const recommendedVideoSchema = z.object({
  videoId: youtubeVideoIdSchema,
})

// 並び替えスキーマ
const reorderVideosSchema = z.object({
  videoIds: z.array(z.string()).min(1, "並び替える動画が必要です"),
})

// Twitchチャンネル設定スキーマ
const twitchChannelSchema = z.object({
  username: twitchUsernameSchema,
})

// ライブ優先度設定スキーマ
const livePrioritySchema = z.enum(["youtube", "twitch"])

// =============================================================================
// YouTube関連 - Channel設定
// =============================================================================

/**
 * URLからYouTube Channel IDを抽出
 */
export async function extractChannelIdFromUrl(url: string): Promise<{ success: boolean; channelId?: string; error?: string }> {
  try {
    // すでにChannel IDの形式ならそのまま返す
    if (/^UC[\w-]{22}$/.test(url)) {
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
        return { success: false, error: "このURL形式は現在サポートされていません。Channel ID (UC...)を直接入力してください" }
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

/**
 * YouTube RSS Feedを取得
 */
export async function fetchYoutubeRssFeed(channelId: string, limit: number = 15) {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

    const response = await fetch(rssUrl, {
      next: {
        revalidate: 86400, // 24時間キャッシュ（PubSubHubbub Webhook使用時）
        tags: [`youtube-${channelId}`]
      }
    })

    if (!response.ok) {
      console.error('RSS Feed response not OK:', response.status, response.statusText)
      return { success: false, error: "RSS Feedの取得に失敗しました" }
    }

    const xmlText = await response.text()
    const parser = new XMLParser({ ignoreAttributes: false })
    const result = parser.parse(xmlText)

    // 動画エントリーを抽出
    const entries = Array.isArray(result.feed?.entry) ? result.feed.entry : [result.feed?.entry].filter(Boolean)

    interface RSSEntry {
      'yt:videoId': string
      title: string
      published: string
      'media:group'?: {
        'media:thumbnail'?: {
          '@_url': string
        }
      }
    }

    const videos = entries.slice(0, limit).map((entry: RSSEntry) => ({
      videoId: entry['yt:videoId'],
      title: entry.title,
      thumbnail: entry['media:group']?.['media:thumbnail']?.['@_url'],
      publishedAt: entry.published,
    }))

    return { success: true, data: videos }
  } catch (error) {
    console.error("YouTube RSS Feed取得エラー:", error)
    return { success: false, error: "RSS Feedの解析に失敗しました" }
  }
}

// =============================================================================
// YouTube関連 - おすすめ動画
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

    // 最大6本チェック
    const existingCount = await prisma.youTubeRecommendedVideo.count({
      where: { userId: session.user.id }
    })

    if (existingCount >= 6) {
      return { success: false, error: "おすすめ動画は最大6本まで設定できます" }
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
    let title: string | null = null
    let thumbnail: string | null = null

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${validatedData.videoId}&format=json`
      const response = await fetch(oembedUrl)
      if (response.ok) {
        const data = await response.json()
        title = data.title || null
        thumbnail = data.thumbnail_url || null
      }
    } catch (error) {
      console.error("YouTube oEmbed APIエラー:", error)
      // メタデータ取得失敗してもVideoIDは保存する
    }

    // フォールバック: サムネイルURLを構築
    if (!thumbnail) {
      thumbnail = `https://img.youtube.com/vi/${validatedData.videoId}/maxresdefault.jpg`
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
// Twitch関連
// =============================================================================

/**
 * Twitchチャンネル設定を更新
 */
export async function updateTwitchChannel(data: z.infer<typeof twitchChannelSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const validatedData = twitchChannelSchema.parse(data)

    // Twitch User IDを取得
    const userIdResult = await getTwitchUserId(validatedData.username)
    if (!userIdResult.success || !userIdResult.userId) {
      return { success: false, error: userIdResult.error || "Twitch User IDの取得に失敗しました" }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twitchUsername: validatedData.username,
        twitchUserId: userIdResult.userId,
      },
    })

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true, data: { twitchUserId: userIdResult.userId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("Twitchチャンネル更新エラー:", error)
    return { success: false, error: "Twitchチャンネル設定の更新に失敗しました" }
  }
}

/**
 * ライブ配信優先度設定を更新
 */
export async function updateLivePriority(priority: z.infer<typeof livePrioritySchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const validatedPriority = livePrioritySchema.parse(priority)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        livePriority: validatedPriority,
      },
    })

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("ライブ優先度更新エラー:", error)
    return { success: false, error: "ライブ優先度設定の更新に失敗しました" }
  }
}

// =============================================================================
// 公開API - データ取得
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

/**
 * ユーザーのTwitch設定を取得
 */
export async function getUserTwitchSettings() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twitchUsername: true,
        twitchUserId: true,
        livePriority: true,
      },
    })

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error("Twitch設定取得エラー:", error)
    return { success: false, error: "Twitch設定の取得に失敗しました" }
  }
}

// ========================================
// 公開API: ライブ配信取得
// ========================================

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

// =============================================================================
// YouTube PubSubHubbub 管理
// =============================================================================

/**
 * YouTube PubSubHubbub に subscribe
 */
export async function subscribeToYoutubePush(channelId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // Validate channel ID
    const validationResult = youtubeChannelIdSchema.safeParse(channelId)
    if (!validationResult.success) {
      return { success: false, error: "有効なYouTube Channel IDではありません" }
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/youtube`
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe"

    // Create subscription request
    const formData = new URLSearchParams({
      "hub.callback": callbackUrl,
      "hub.topic": topicUrl,
      "hub.mode": "subscribe",
      "hub.verify": "async",
      "hub.lease_seconds": "864000", // 10 days
    })

    console.log(`[PubSubHubbub] Subscribing to channel ${channelId}`)

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (response.status === 202) {
      console.log(`[PubSubHubbub] Subscription request accepted for channel ${channelId}`)
      return { success: true, message: "Subscription request sent successfully" }
    } else {
      const errorText = await response.text()
      console.error(`[PubSubHubbub] Subscription failed:`, errorText)
      return { success: false, error: `Subscription failed: ${response.status}` }
    }
  } catch (error) {
    console.error("[PubSubHubbub] Subscription error:", error)
    return { success: false, error: "Subscription request failed" }
  }
}

/**
 * YouTube PubSubHubbub から unsubscribe
 */
export async function unsubscribeFromYoutubePush(channelId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // Validate channel ID
    const validationResult = youtubeChannelIdSchema.safeParse(channelId)
    if (!validationResult.success) {
      return { success: false, error: "有効なYouTube Channel IDではありません" }
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/youtube`
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe"

    // Create unsubscription request
    const formData = new URLSearchParams({
      "hub.callback": callbackUrl,
      "hub.topic": topicUrl,
      "hub.mode": "unsubscribe",
      "hub.verify": "async",
    })

    console.log(`[PubSubHubbub] Unsubscribing from channel ${channelId}`)

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (response.status === 202) {
      console.log(`[PubSubHubbub] Unsubscription request accepted for channel ${channelId}`)
      return { success: true, message: "Unsubscription request sent successfully" }
    } else {
      const errorText = await response.text()
      console.error(`[PubSubHubbub] Unsubscription failed:`, errorText)
      return { success: false, error: `Unsubscription failed: ${response.status}` }
    }
  } catch (error) {
    console.error("[PubSubHubbub] Unsubscription error:", error)
    return { success: false, error: "Unsubscription request failed" }
  }
}

/**
 * ========================
 * Twitch API 関連
 * ========================
 */

/**
 * Twitch App Access Tokenを取得
 */
async function getTwitchAppAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error("[Twitch API] Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET")
    return null
  }

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      console.error("[Twitch API] Failed to get app access token:", response.status)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("[Twitch API] Error getting app access token:", error)
    return null
  }
}

/**
 * Twitch UsernameからUser IDを取得
 */
export async function getTwitchUserId(username: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    const accessToken = await getTwitchAppAccessToken()

    if (!clientId || !accessToken) {
      return { success: false, error: "Twitch API credentials not configured" }
    }

    const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("[Twitch API] Failed to get user ID:", response.status)
      return { success: false, error: `Failed to get user ID: ${response.status}` }
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      return { success: false, error: "User not found" }
    }

    return { success: true, userId: data.data[0].id }
  } catch (error) {
    console.error("[Twitch API] Error getting user ID:", error)
    return { success: false, error: "Failed to get user ID" }
  }
}

/**
 * Twitch EventSub Subscriptionを作成
 */
export async function createTwitchEventSub(twitchUserId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const clientId = process.env.TWITCH_CLIENT_ID
    const accessToken = await getTwitchAppAccessToken()
    const webhookSecret = process.env.TWITCH_WEBHOOK_SECRET
    const domain = process.env.NEXT_PUBLIC_DOMAIN || "localhost"

    if (!clientId || !accessToken || !webhookSecret) {
      return { success: false, error: "Twitch API credentials not configured" }
    }

    const callbackUrl = `https://${domain}/api/webhooks/twitch/eventsub`

    // stream.online と stream.offline の2つのサブスクリプションを作成
    const subscriptionTypes = ["stream.online", "stream.offline"]

    for (const type of subscriptionTypes) {
      const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          version: "1",
          condition: {
            broadcaster_user_id: twitchUserId,
          },
          transport: {
            method: "webhook",
            callback: callbackUrl,
            secret: webhookSecret,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Twitch EventSub] Failed to create ${type} subscription:`, errorText)
        return { success: false, error: `Failed to create EventSub subscription: ${response.status}` }
      }

      const data = await response.json()
      const subscriptionId = data.data[0]?.id
      const status = data.data[0]?.status

      if (!subscriptionId) {
        return { success: false, error: "No subscription ID returned" }
      }

      // データベースに保存
      await prisma.twitchEventSubSubscription.create({
        data: {
          userId: session.user.id,
          subscriptionId,
          type,
          status: status || "unknown",
        },
      })

      console.log(`[Twitch EventSub] Created ${type} subscription: ${subscriptionId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("[Twitch EventSub] Error creating subscription:", error)
    return { success: false, error: "Failed to create EventSub subscription" }
  }
}

/**
 * Twitch EventSub Subscriptionを削除
 */
export async function deleteTwitchEventSub(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const clientId = process.env.TWITCH_CLIENT_ID
    const accessToken = await getTwitchAppAccessToken()

    if (!clientId || !accessToken) {
      return { success: false, error: "Twitch API credentials not configured" }
    }

    // データベースから既存のサブスクリプションを取得
    const subscriptions = await prisma.twitchEventSubSubscription.findMany({
      where: { userId: session.user.id },
    })

    // 各サブスクリプションをTwitch APIから削除
    for (const subscription of subscriptions) {
      const response = await fetch(
        `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscription.subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`[Twitch EventSub] Failed to delete subscription ${subscription.subscriptionId}:`, response.status)
      } else {
        console.log(`[Twitch EventSub] Deleted subscription: ${subscription.subscriptionId}`)
      }
    }

    // データベースから削除
    await prisma.twitchEventSubSubscription.deleteMany({
      where: { userId: session.user.id },
    })

    return { success: true }
  } catch (error) {
    console.error("[Twitch EventSub] Error deleting subscriptions:", error)
    return { success: false, error: "Failed to delete EventSub subscriptions" }
  }
}

/**
 * Twitch EventSub Subscriptionのステータスを取得
 */
export async function getTwitchEventSubStatus(): Promise<{
  success: boolean
  isSubscribed: boolean
  subscriptions?: Array<{ type: string; status: string }>
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, isSubscribed: false, error: "認証が必要です" }
    }

    const subscriptions = await prisma.twitchEventSubSubscription.findMany({
      where: { userId: session.user.id },
      select: {
        type: true,
        status: true,
      },
    })

    return {
      success: true,
      isSubscribed: subscriptions.length > 0,
      subscriptions,
    }
  } catch (error) {
    console.error("[Twitch EventSub] Error getting subscription status:", error)
    return { success: false, isSubscribed: false, error: "Failed to get subscription status" }
  }
}
