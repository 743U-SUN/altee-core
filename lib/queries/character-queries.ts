import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'

/**
 * ダッシュボード用: ログインユーザーのキャラクター情報取得
 * React.cache によりリクエスト内の重複呼び出しを排除
 */
export const getDashboardCharacterInfo = cache(async (userId: string) => {
  return prisma.characterInfo.findUnique({
    where: { userId },
    include: {
      platformAccounts: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })
})
