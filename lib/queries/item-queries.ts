import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const handleSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, '不正なハンドルです')

/**
 * 公開ページ用：ハンドルからユーザーの公開アイテムを取得
 */
export async function getUserPublicItemsByHandle(handle: string) {
  const validatedHandle = handleSchema.parse(handle)

  try {
    const user = await prisma.user.findUnique({
      where: { handle: validatedHandle },
      select: { id: true },
    })

    if (!user) {
      return {
        success: false,
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
      success: true,
      data: userItems,
    }
  } catch (error) {
    console.error('Failed to fetch public user items:', error)
    return {
      success: false,
      error: '公開アイテムの取得に失敗しました',
    }
  }
}
