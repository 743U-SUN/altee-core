import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * ダッシュボード用: ログインユーザーのYouTube設定を取得
 * React.cache によりリクエスト内の重複呼び出しを排除
 */
export const getDashboardYoutubeSettings = cache(async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        youtubeChannelId: true,
        youtubeRssFeedLimit: true,
        youtubeRecommendedVideos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!user) {
      return { success: false as const, error: 'ユーザーが見つかりません' }
    }

    return { success: true as const, data: user }
  } catch {
    return { success: false as const, error: 'YouTube設定の取得に失敗しました' }
  }
})
