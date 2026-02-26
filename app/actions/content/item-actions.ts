'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { userItemSchema, type UserItemInput } from '@/lib/validations/item'

// ===== UserItem CRUD =====

/**
 * ユーザーが特定のアイテムを既に所有しているかチェック
 */
export async function checkUserItemExists(
  userId: string,
  itemId: string
): Promise<boolean> {
  const userItem = await prisma.userItem.findUnique({
    where: {
      userId_itemId: {
        userId,
        itemId,
      },
    },
  })

  return !!userItem
}

/**
 * ユーザーのアイテム一覧を取得
 */
export async function getUserItems(userId: string) {
  const userItems = await prisma.userItem.findMany({
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

  return userItems
}

/**
 * ユーザーにアイテムを追加
 */
export async function createUserItem(userId: string, data: UserItemInput) {
  try {
    // バリデーション
    const validated = userItemSchema.parse(data)

    // アイテムの存在確認
    const item = await prisma.item.findUnique({
      where: { id: validated.itemId },
    })

    if (!item) {
      return {
        success: false,
        error: '指定されたアイテムが見つかりませんでした',
      }
    }

    // 既に追加されていないかチェック
    const exists = await checkUserItemExists(userId, validated.itemId)
    if (exists) {
      return {
        success: false,
        error: 'このアイテムは既に追加されています',
      }
    }

    // 現在の最大sortOrderを取得
    const maxSortOrder = await prisma.userItem.findFirst({
      where: { userId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    // 新しいアイテムを追加
    const userItem = await prisma.userItem.create({
      data: {
        userId,
        itemId: validated.itemId,
        review: validated.review,
        isPublic: validated.isPublic,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
      include: {
        item: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
    })

    // handleを取得してパスをrevalidate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    })

    revalidatePath('/dashboard/items')
    if (user?.handle) {
      revalidatePath(`/@${user.handle}/items`)
    }

    return {
      success: true,
      data: userItem,
    }
  } catch (error) {
    console.error('Failed to create user item:', error)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'ユーザーアイテムの作成に失敗しました',
    }
  }
}

/**
 * ユーザーアイテムを更新
 */
export async function updateUserItem(
  userId: string,
  userItemId: string,
  data: Partial<UserItemInput>
) {
  try {
    // 所有権確認
    const userItem = await prisma.userItem.findUnique({
      where: { id: userItemId },
    })

    if (!userItem || userItem.userId !== userId) {
      return {
        success: false,
        error: 'ユーザーアイテムが見つかりませんでした',
      }
    }

    // 更新
    const updated = await prisma.userItem.update({
      where: { id: userItemId },
      data: {
        review: data.review,
        isPublic: data.isPublic,
      },
      include: {
        item: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
    })

    // handleを取得してパスをrevalidate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    })

    revalidatePath('/dashboard/items')
    if (user?.handle) {
      revalidatePath(`/@${user.handle}/items`)
    }

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error('Failed to update user item:', error)
    return {
      success: false,
      error: 'ユーザーアイテムの更新に失敗しました',
    }
  }
}

/**
 * ユーザーアイテムを削除
 */
export async function deleteUserItem(userId: string, userItemId: string) {
  try {
    // 所有権確認
    const userItem = await prisma.userItem.findUnique({
      where: { id: userItemId },
    })

    if (!userItem || userItem.userId !== userId) {
      return {
        success: false,
        error: 'ユーザーアイテムが見つかりませんでした',
      }
    }

    // 削除
    await prisma.userItem.delete({
      where: { id: userItemId },
    })

    // handleを取得してパスをrevalidate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    })

    revalidatePath('/dashboard/items')
    if (user?.handle) {
      revalidatePath(`/@${user.handle}/items`)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to delete user item:', error)
    return {
      success: false,
      error: 'ユーザーアイテムの削除に失敗しました',
    }
  }
}

/**
 * ユーザーアイテムの並び順を更新
 */
export async function reorderUserItems(
  userId: string,
  itemIds: string[]
) {
  try {
    // トランザクションで一括更新
    await prisma.$transaction(
      itemIds.map((id, index) =>
        prisma.userItem.update({
          where: {
            id,
            userId, // 所有権確認
          },
          data: {
            sortOrder: index,
          },
        })
      )
    )

    // handleを取得してパスをrevalidate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { handle: true },
    })

    revalidatePath('/dashboard/items')
    if (user?.handle) {
      revalidatePath(`/@${user.handle}/items`)
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to reorder user items:', error)
    return {
      success: false,
      error: 'ユーザーアイテムの並び替えに失敗しました',
    }
  }
}

/**
 * 公開ページ用：ハンドルからユーザーの公開アイテムを取得
 */
export async function getUserPublicItemsByHandle(handle: string) {
  try {
    // ユーザーを取得
    const user = await prisma.user.findUnique({
      where: { handle },
      select: { id: true },
    })

    if (!user) {
      return {
        success: false,
        error: 'ユーザーが見つかりませんでした',
      }
    }

    // 公開アイテムを取得
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

/**
 * アイテム一覧を検索・フィルタして取得（モーダル用）
 */
export async function getItems(params?: {
  search?: string
  categoryId?: string
  brandId?: string
}) {
  try {
    const where = {
      ...(params?.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' as const } },
          {
            description: {
              contains: params.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
      ...(params?.categoryId && { categoryId: params.categoryId }),
      ...(params?.brandId && { brandId: params.brandId }),
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
        brand: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // 検索結果は50件まで
    })

    return {
      success: true,
      data: items,
    }
  } catch (error) {
    console.error('Failed to fetch items:', error)
    return {
      success: false,
      error: 'アイテムの取得に失敗しました',
    }
  }
}
