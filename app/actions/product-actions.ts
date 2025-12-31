'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { userProductSchema, type UserProductInput } from '@/lib/validation/product'

// ===== UserProduct CRUD =====

/**
 * ユーザーが特定の商品を既に所有しているかチェック
 */
export async function checkUserProductExists(
  userId: string,
  productId: string
): Promise<boolean> {
  const userProduct = await prisma.userProduct.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  })

  return !!userProduct
}

/**
 * ユーザーの商品一覧を取得
 */
export async function getUserProducts(userId: string) {
  const userProducts = await prisma.userProduct.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: true,
          brand: true,
        },
      },
    },
    orderBy: { sortOrder: 'asc' },
  })

  return userProducts
}

/**
 * ユーザーに商品を追加
 */
export async function createUserProduct(userId: string, data: UserProductInput) {
  try {
    // バリデーション
    const validated = userProductSchema.parse(data)

    // 商品の存在確認
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    })

    if (!product) {
      return {
        success: false,
        error: '指定された商品が見つかりませんでした',
      }
    }

    // 既に追加されていないかチェック
    const exists = await checkUserProductExists(userId, validated.productId)
    if (exists) {
      return {
        success: false,
        error: 'この商品は既に追加されています',
      }
    }

    // 現在の最大sortOrderを取得
    const maxSortOrder = await prisma.userProduct.findFirst({
      where: { userId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    // 新しい商品を追加
    const userProduct = await prisma.userProduct.create({
      data: {
        userId,
        productId: validated.productId,
        review: validated.review,
        isPublic: validated.isPublic,
        sortOrder: (maxSortOrder?.sortOrder ?? -1) + 1,
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/products')
    revalidatePath(`/@${userId}/products`)

    return {
      success: true,
      data: userProduct,
    }
  } catch (error) {
    console.error('Failed to create user product:', error)
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'ユーザー商品の作成に失敗しました',
    }
  }
}

/**
 * ユーザー商品を更新
 */
export async function updateUserProduct(
  userId: string,
  userProductId: string,
  data: Partial<UserProductInput>
) {
  try {
    // 所有権確認
    const userProduct = await prisma.userProduct.findUnique({
      where: { id: userProductId },
    })

    if (!userProduct || userProduct.userId !== userId) {
      return {
        success: false,
        error: 'ユーザー商品が見つかりませんでした',
      }
    }

    // 更新
    const updated = await prisma.userProduct.update({
      where: { id: userProductId },
      data: {
        review: data.review,
        isPublic: data.isPublic,
      },
      include: {
        product: {
          include: {
            category: true,
            brand: true,
          },
        },
      },
    })

    revalidatePath('/dashboard/products')
    revalidatePath(`/@${userId}/products`)

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    console.error('Failed to update user product:', error)
    return {
      success: false,
      error: 'ユーザー商品の更新に失敗しました',
    }
  }
}

/**
 * ユーザー商品を削除
 */
export async function deleteUserProduct(userId: string, userProductId: string) {
  try {
    // 所有権確認
    const userProduct = await prisma.userProduct.findUnique({
      where: { id: userProductId },
    })

    if (!userProduct || userProduct.userId !== userId) {
      return {
        success: false,
        error: 'ユーザー商品が見つかりませんでした',
      }
    }

    // 削除
    await prisma.userProduct.delete({
      where: { id: userProductId },
    })

    revalidatePath('/dashboard/products')
    revalidatePath(`/@${userId}/products`)

    return { success: true }
  } catch (error) {
    console.error('Failed to delete user product:', error)
    return {
      success: false,
      error: 'ユーザー商品の削除に失敗しました',
    }
  }
}

/**
 * ユーザー商品の並び順を更新
 */
export async function reorderUserProducts(
  userId: string,
  productIds: string[]
) {
  try {
    // トランザクションで一括更新
    await prisma.$transaction(
      productIds.map((id, index) =>
        prisma.userProduct.update({
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

    revalidatePath('/dashboard/products')
    revalidatePath(`/@${userId}/products`)

    return { success: true }
  } catch (error) {
    console.error('Failed to reorder user products:', error)
    return {
      success: false,
      error: 'ユーザー商品の並び替えに失敗しました',
    }
  }
}

/**
 * 公開ページ用：ハンドルからユーザーの公開商品を取得
 */
export async function getUserPublicProductsByHandle(handle: string) {
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

    // 公開商品を取得
    const userProducts = await prisma.userProduct.findMany({
      where: {
        userId: user.id,
        isPublic: true,
      },
      include: {
        product: {
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
      data: userProducts,
    }
  } catch (error) {
    console.error('Failed to fetch public user products:', error)
    return {
      success: false,
      error: '公開商品の取得に失敗しました',
    }
  }
}

/**
 * 商品一覧を検索・フィルタして取得（モーダル用）
 */
export async function getProducts(params?: {
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

    const products = await prisma.product.findMany({
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
      data: products,
    }
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return {
      success: false,
      error: '商品の取得に失敗しました',
    }
  }
}
