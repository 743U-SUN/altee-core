/** ニコニコおすすめ動画の最大数 */
export const MAX_NICONICO_RECOMMENDED_VIDEOS = 6

/** ニコニコ動画 Video ID パターン (sm/nm/so + 数字) */
export const NICONICO_VIDEO_ID_PATTERN = /^(sm|nm|so)\d+$/

/** URL から Video ID を抽出するパターン */
export const NICONICO_URL_PATTERNS = [
  /nicovideo\.jp\/watch\/((sm|nm|so)\d+)/,
  /nico\.ms\/((sm|nm|so)\d+)/,
] as const

/** getthumbinfo API URL */
export const NICONICO_THUMBINFO_API_URL = 'https://ext.nicovideo.jp/api/getthumbinfo'

/** 埋め込みプレーヤー URL */
export const NICONICO_EMBED_URL = 'https://embed.nicovideo.jp/watch'
