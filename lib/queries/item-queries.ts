import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { queryHandleSchema, normalizeHandle } from '@/lib/validations/shared'

/**
 * 公開ページ用：ハンドルからユーザーの公開アイテムを取得
 */
export const getUserPublicItemsByHandle = cache(async (handle: string) => {
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)

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
  } catch (error) {
    console.error('Failed to fetch public user items:', error)
    return {
      success: false as const,
      error: '公開アイテムの取得に失敗しました',
    }
  }
})
