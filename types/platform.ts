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

export interface TwitchLiveStatus {
  isLive: boolean
  streamId: string | null
  streamTitle: string | null
  streamThumbnail: string | null
  viewerCount: number | null
  startedAt: Date | null
}

export type Platform = "youtube" | "twitch"
