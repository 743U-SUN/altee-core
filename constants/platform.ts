/**
 * プラットフォーム関連の定数
 */

// おすすめ動画の最大数
export const MAX_RECOMMENDED_VIDEOS = 6

// RSS Feed の最大表示数
export const MAX_RSS_FEED_LIMIT = 15

// RSS Feed のデフォルト表示数
export const DEFAULT_RSS_FEED_LIMIT = 6

// RSS Feed のキャッシュ時間（秒）
export const RSS_FEED_CACHE_SECONDS = 86400 // 24時間

// YouTube Channel ID のパターン（UC + 22文字）
export const YOUTUBE_CHANNEL_ID_PATTERN = /^UC[\w-]{22}$/

// YouTube Video ID のパターン（11文字）
export const YOUTUBE_VIDEO_ID_PATTERN = /^[\w-]{11}$/

// Twitch Username のパターン（4-25文字の英数字とアンダースコア）
export const TWITCH_USERNAME_PATTERN = /^[a-zA-Z0-9_]{4,25}$/
