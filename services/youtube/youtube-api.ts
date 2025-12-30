/**
 * YouTube API サービス
 * YouTube oEmbed API と RSS Feed の取得を担当
 */

import { XMLParser } from "fast-xml-parser"
import { RSS_FEED_CACHE_SECONDS } from "@/constants/platform"

/**
 * YouTube oEmbed API から動画メタデータを取得
 */
export async function fetchYoutubeVideoMetadata(videoId: string): Promise<{
  success: boolean
  title?: string
  thumbnail?: string
  error?: string
}> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(oembedUrl)

    if (!response.ok) {
      console.error("[YouTube oEmbed API] Response not OK:", response.status)
      return {
        success: false,
        error: "動画情報の取得に失敗しました"
      }
    }

    const data = await response.json()

    return {
      success: true,
      title: data.title || undefined,
      thumbnail: data.thumbnail_url || undefined,
    }
  } catch (error) {
    console.error("[YouTube oEmbed API] Error:", error)
    return {
      success: false,
      error: "動画情報の取得中にエラーが発生しました"
    }
  }
}

/**
 * YouTube のサムネイルURLを構築（フォールバック用）
 */
export function getYoutubeThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
}

/**
 * YouTube RSS Feed を取得
 */
export async function fetchYoutubeRssFeed(
  channelId: string,
  limit: number = 15
): Promise<{
  success: boolean
  data?: Array<{
    videoId: string
    title: string
    thumbnail?: string
    publishedAt: string
  }>
  error?: string
}> {
  try {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`

    const response = await fetch(rssUrl, {
      next: {
        revalidate: RSS_FEED_CACHE_SECONDS,
        tags: [`youtube-${channelId}`]
      }
    })

    if (!response.ok) {
      console.error("[YouTube RSS Feed] Response not OK:", response.status, response.statusText)
      return { success: false, error: "RSS Feedの取得に失敗しました" }
    }

    const xmlText = await response.text()
    const parser = new XMLParser({ ignoreAttributes: false })
    const result = parser.parse(xmlText)

    // 動画エントリーを抽出
    const entries = Array.isArray(result.feed?.entry)
      ? result.feed.entry
      : [result.feed?.entry].filter(Boolean)

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
    console.error("[YouTube RSS Feed] Error:", error)
    return { success: false, error: "RSS Feedの解析に失敗しました" }
  }
}
