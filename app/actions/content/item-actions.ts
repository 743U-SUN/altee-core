'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath, updateTag } from 'next/cache'
import { z } from 'zod'
import { cuidArraySchema, normalizeHandle } from '@/lib/validations/shared'
import { userItemSchema, type UserItemInput } from '@/lib/validations/item'

// 公開用読み取り関数は lib/queries/item-queries.ts に移動済み
// getUserPublicItemsByHandle → lib/queries/item-queries.ts

const getItemsParamsSchema = z.object({
  search: z.string().max(100).optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
}).optional()

/**
 * アイテム一覧を検索・フィルタして取得（モーダル用）
 * クライアントコンポーネントから呼び出されるためServer Actionとして維持
 */
export async function getItems(params?: {
  search?: string
  categoryId?: string
  brandId?: string
}) {
  await requireAuth()
  const validatedParams = getItemsParamsSchema.parse(params)

  try {
    const where = {
      ...(validatedParams?.search && {
        OR: [
          { name: { contains: validatedParams.search, mode: 'insensitive' as const } },
          {
            description: {
              contains: validatedParams.search,
              mode: 'insensitive' as const,
            },
          },
        ],
      }),
      ...(validatedParams?.categoryId && { categoryId: validatedParams.categoryId }),
      ...(validatedParams?.brandId && { brandId: validatedParams.brandId }),
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        category: true,
        brand: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return {
      success: true,
      data: items,
    }
  } catch {
    return {
      success: false,
      error: 'アイテムの取得に失敗しました',
    }
  }
}

// ===== UserItem CRUD =====

/**
 * ユーザーが特定のアイテムを既に所有しているかチェック
 */
export async function checkUserItemExists(
  itemId: string
): Promise<boolean> {
  const session = await requireAuth()
  const userItem = await prisma.userItem.findUnique({
    where: {
      userId_itemId: {
        userId: session.user.id,
        itemId,
      },
    },
  })

  return !!userItem
}

/**
 * ユーザーのアイテム一覧を取得
 */
export async function getUserItems() {
  const session = await requireAuth()
  const userItems = await prisma.userItem.findMany({
    where: { userId: session.user.id },
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
export async function createUserItem(data: UserItemInput) {
  const session = await requireAuth()
  const userId = session.user.id
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
    const existingItem = await prisma.userItem.findUnique({
      where: {
        userId_itemId: {
          userId,
          itemId: validated.itemId,
        },
      },
    })
    if (existingItem) {
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

    revalidatePath('/dashboard/items')
    revalidatePath(`/@${session.user.handle}/items`)
    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }

    return {
      success: true,
      data: userItem,
    }
  } catch (error) {
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
  userItemId: string,
  data: Partial<UserItemInput>
) {
  const session = await requireAuth()
  const userId = session.user.id
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

    revalidatePath('/dashboard/items')
    revalidatePath(`/@${session.user.handle}/items`)
    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }

    return {
      success: true,
      data: updated,
    }
  } catch {
    return {
      success: false,
      error: 'ユーザーアイテムの更新に失敗しました',
    }
  }
}

/**
 * ユーザーアイテムを削除
 */
export async function deleteUserItem(userItemId: string) {
  const session = await requireAuth()
  const userId = session.user.id
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

    revalidatePath('/dashboard/items')
    revalidatePath(`/@${session.user.handle}/items`)
    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }

    return { success: true }
  } catch {
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
  itemIds: string[]
) {
  const session = await requireAuth()
  const userId = session.user.id
  const validatedIds = cuidArraySchema.parse(itemIds)

  try {
    // トランザクションで一括更新
    await prisma.$transaction(
      validatedIds.map((id, index) =>
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

    revalidatePath('/dashboard/items')
    revalidatePath(`/@${session.user.handle}/items`)
    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'ユーザーアイテムの並び替えに失敗しました',
    }
  }
}

