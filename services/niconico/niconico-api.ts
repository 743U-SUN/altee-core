import 'server-only'
import { XMLParser } from 'fast-xml-parser'
import {
  NICONICO_VIDEO_ID_PATTERN,
  NICONICO_URL_PATTERNS,
  NICONICO_THUMBINFO_API_URL,
} from './constants'

const xmlParser = new XMLParser()

export interface NiconicoVideoMetadata {
  videoId: string
  title: string
  thumbnail: string
  description?: string
}

/**
 * URL/テキストからニコニコ動画IDを抽出
 * @param input - URL or Video ID (e.g. "sm12345", "https://www.nicovideo.jp/watch/sm12345")
 * @returns Video ID or null
 */
export function extractNiconicoVideoId(input: string): string | null {
  if (input.length > 500) return null
  const trimmed = input.trim()

  // 直接 Video ID の場合
  if (NICONICO_VIDEO_ID_PATTERN.test(trimmed)) {
    return trimmed
  }

  // URL パターンから抽出
  for (const pattern of NICONICO_URL_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * ニコニコ動画のメタデータを取得 (getthumbinfo API)
 * @param videoId - ニコニコ動画 ID (e.g. "sm12345")
 * @returns メタデータ or null (取得失敗時)
 */
export async function fetchNiconicoVideoMetadata(
  videoId: string
): Promise<NiconicoVideoMetadata | null> {
  try {
    const response = await fetch(`${NICONICO_THUMBINFO_API_URL}/${encodeURIComponent(videoId)}`, {
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) return null

    const xml = await response.text()
    // Defense-in-depth: XML レスポンスのサイズ上限チェック (1MB)
    if (xml.length > 1_000_000) return null
    const result = xmlParser.parse(xml)

    const thumb = result?.nicovideo_thumb_response?.thumb
    if (!thumb) return null

    return {
      videoId,
      title: String(thumb.title || ''),
      thumbnail: String(thumb.thumbnail_url || ''),
      description: thumb.description ? String(thumb.description) : undefined,
    }
  } catch {
    return null
  }
}
