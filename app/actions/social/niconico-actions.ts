'use server'

import { requireAuth } from '@/lib/auth'
import { extractNiconicoVideoId, fetchNiconicoVideoMetadata } from '@/services/niconico/niconico-api'

/**
 * ニコニコ動画 URL からメタデータを取得
 */
export async function getNiconicoMetadata(url: string) {
  try {
    await requireAuth()

    if (!url || url.length > 500) {
      return { success: false as const, error: '有効なニコニコ動画URLまたはIDではありません' }
    }

    const videoId = extractNiconicoVideoId(url)
    if (!videoId) {
      return { success: false as const, error: '有効なニコニコ動画URLまたはIDではありません' }
    }

    const metadata = await fetchNiconicoVideoMetadata(videoId)
    if (!metadata) {
      return { success: false as const, error: '動画情報の取得に失敗しました' }
    }

    return {
      success: true as const,
      data: metadata,
    }
  } catch (error) {
    console.error('ニコニコメタデータ取得エラー:', error)
    return { success: false as const, error: 'メタデータの取得に失敗しました' }
  }
}
