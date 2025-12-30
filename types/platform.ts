/**
 * プラットフォーム関連の型定義
 */

export interface YouTubeRecommendedVideo {
  id: string
  videoId: string
  title: string | null
  thumbnail: string | null
  sortOrder: number
  isVisible: boolean
}

export interface VideoCardData {
  videoId: string
  title: string
  thumbnail?: string
}

export interface TwitchLiveStatus {
  isLive: boolean
  streamId: string | null
  streamTitle: string | null
  streamThumbnail: string | null
  viewerCount: number | null
  startedAt: Date | null
}

export type Platform = "youtube" | "twitch"

export type LivePriority = "youtube" | "twitch"

export interface LiveStreamData {
  platform: Platform
  isLive: boolean
  // YouTube fields
  videoId?: string
  // Twitch fields
  twitchUsername?: string
  streamTitle?: string | null
  viewerCount?: number | null
}
