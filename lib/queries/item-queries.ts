import 'server-only'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { queryHandleSchema, normalizeHandle } from '@/lib/validations/shared'

/**
 * ダッシュボード用: ログインユーザーのアイテム一覧取得
 */
export const getDashboardUserItems = cache(async (userId: string) => {
  return prisma.userItem.findMany({
    where: { userId },
    include: {
      item: {
        include: {
          category: true,
          brand: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })
})

/**
 * ダッシュボード用: ログインユーザーのPCビルド取得
 */
export const getDashboardUserPcBuild = cache(async (userId: string) => {
  try {
    const pcBuild = await prisma.userPcBuild.findUnique({
      where: { userId },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            item: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
      },
    })
    return { success: true as const, data: pcBuild }
  } catch {
    return { success: false as const, error: 'PCビルドの取得に失敗しました' }
  }
})

/**
 * 公開ページ用：ハンドルからユーザーの公開アイテムを取得
 * 'use cache' でクロスリクエストキャッシュ
 */
export async function getUserPublicItemsByHandle(handle: string) {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`items-${normalized}`)

  try {
    const user = await prisma.user.findUnique({
      where: { handle: normalized },
      select: { id: true, isActive: true },
    })

    if (!user || !user.isActive) {
      return {
        success: false as const,
        error: 'ユーザーが見つかりませんでした',
      }
    }

    const userItems = await prisma.userItem.findMany({
      where: {
        userId: user.id,
        isPublic: true,
      },
      include: {
        item: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return {
      success: true as const,
      data: userItems,
    }
  } catch {
    return {
      success: false as const,
      error: '公開アイテムの取得に失敗しました',
    }
  }
}
