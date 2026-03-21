'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import {
  itemCategorySchema,
  type ItemCategoryInput,
} from '@/lib/validations/item'
import { revalidatePath } from 'next/cache'
import { cuidSchema } from '@/lib/validations/shared'

// ===== カテゴリ一覧取得 =====

export async function getCategoriesAction() {
  await requireAdmin()
  try {
    const categories = await prisma.itemCategory.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            items: true,
            children: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return { success: true, data: categories }
  } catch {
    return {
      success: false,
      error: 'カテゴリの取得に失敗しました',
    }
  }
}

// ===== カテゴリ詳細取得 =====

export async function getCategoryByIdAction(id: string) {
  await requireAdmin()
  const validatedId = cuidSchema.parse(id)
  try {
    const category = await prisma.itemCategory.findUnique({
      where: { id: validatedId },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            items: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      return {
        success: false,
        error: 'カテゴリが見つかりませんでした',
      }
    }

    return { success: true, data: category }
  } catch {
    return {
      success: false,
      error: 'カテゴリの取得に失敗しました',
    }
  }
}

// ===== カテゴリ作成 =====

export async function createCategoryAction(input: ItemCategoryInput) {
  await requireAdmin()
  try {
    // バリデーション
    const validated = itemCategorySchema.parse(input)

    // slugの重複チェック
    const existingCategory = await prisma.itemCategory.findUnique({
      where: { slug: validated.slug },
    })

    if (existingCategory) {
      return {
        success: false,
        error: 'このスラッグは既に使用されています',
      }
    }

    // 親カテゴリの存在確認
    if (validated.parentId) {
      const parentCategory = await prisma.itemCategory.findUnique({
        where: { id: validated.parentId },
      })

      if (!parentCategory) {
        return {
          success: false,
          error: '指定された親カテゴリが見つかりませんでした',
        }
      }
    }

    // カテゴリ作成
    const category = await prisma.itemCategory.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        parentId: validated.parentId || null,
        itemType: validated.itemType,
        requiresCompatibilityCheck: validated.requiresCompatibilityCheck,
        icon: validated.icon || null,
        description: validated.description || null,
        sortOrder: validated.sortOrder,
      },
    })

    revalidatePath('/admin/item-categories')
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'カテゴリの作成に失敗しました',
    }
  }
}

// ===== カテゴリ更新 =====

export async function updateCategoryAction(
  id: string,
  input: ItemCategoryInput
) {
  await requireAdmin()
  const validatedId = cuidSchema.parse(id)
  try {
    // バリデーション
    const validated = itemCategorySchema.parse(input)

    // カテゴリの存在確認
    const existingCategory = await prisma.itemCategory.findUnique({
      where: { id: validatedId },
    })

    if (!existingCategory) {
      return {
        success: false,
        error: 'カテゴリが見つかりませんでした',
      }
    }

    // slugの重複チェック（自分以外）
    if (validated.slug !== existingCategory.slug) {
      const duplicateCategory = await prisma.itemCategory.findUnique({
        where: { slug: validated.slug },
      })

      if (duplicateCategory) {
        return {
          success: false,
          error: 'このスラッグは既に使用されています',
        }
      }
    }

    // 親カテゴリの検証
    if (validated.parentId) {
      // 自分自身を親にできない
      if (validated.parentId === validatedId) {
        return {
          success: false,
          error: '自分自身を親カテゴリにすることはできません',
        }
      }

      // 親カテゴリの存在確認
      const parentCategory = await prisma.itemCategory.findUnique({
        where: { id: validated.parentId },
      })

      if (!parentCategory) {
        return {
          success: false,
          error: '指定された親カテゴリが見つかりませんでした',
        }
      }

      // 循環参照チェック（子カテゴリを親にできない）
      const isDescendant = await checkIsDescendant(validatedId, validated.parentId)
      if (isDescendant) {
        return {
          success: false,
          error: '子カテゴリを親カテゴリにすることはできません',
        }
      }
    }

    // カテゴリ更新
    const category = await prisma.itemCategory.update({
      where: { id: validatedId },
      data: {
        name: validated.name,
        slug: validated.slug,
        parentId: validated.parentId || null,
        itemType: validated.itemType,
        requiresCompatibilityCheck: validated.requiresCompatibilityCheck,
        icon: validated.icon || null,
        description: validated.description || null,
        sortOrder: validated.sortOrder,
      },
    })

    revalidatePath('/admin/item-categories')
    return { success: true, data: category }
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      }
    }
    return {
      success: false,
      error: 'カテゴリの更新に失敗しました',
    }
  }
}

// ===== カテゴリ削除 =====

export async function deleteCategoryAction(id: string) {
  await requireAdmin()
  const validatedId = cuidSchema.parse(id)
  try {
    // カテゴリの存在確認
    const category = await prisma.itemCategory.findUnique({
      where: { id: validatedId },
      include: {
        _count: {
          select: {
            items: true,
            children: true,
          },
        },
      },
    })

    if (!category) {
      return {
        success: false,
        error: 'カテゴリが見つかりませんでした',
      }
    }

    // アイテムが紐づいている場合は削除不可
    if (category._count.items > 0) {
      return {
        success: false,
        error: `このカテゴリには${category._count.items}件のアイテムが紐づいています。先にアイテムを削除または移動してください。`,
      }
    }

    // 子カテゴリが存在する場合は削除不可
    if (category._count.children > 0) {
      return {
        success: false,
        error: `このカテゴリには${category._count.children}件の子カテゴリが存在します。先に子カテゴリを削除または移動してください。`,
      }
    }

    // カテゴリ削除
    await prisma.itemCategory.delete({
      where: { id: validatedId },
    })

    revalidatePath('/admin/item-categories')
    return { success: true }
  } catch {
    return {
      success: false,
      error: 'カテゴリの削除に失敗しました',
    }
  }
}

// ===== ヘルパー関数 =====

// 循環参照チェック用：targetIdがcategoryIdの子孫かどうか
async function checkIsDescendant(
  categoryId: string,
  targetId: string
): Promise<boolean> {
  const category = await prisma.itemCategory.findUnique({
    where: { id: categoryId },
    include: {
      children: true,
    },
  })

  if (!category) return false

  // 直接の子カテゴリに含まれているか
  if (category.children.some((child) => child.id === targetId)) {
    return true
  }

  // 再帰的に子カテゴリをチェック
  for (const child of category.children) {
    if (await checkIsDescendant(child.id, targetId)) {
      return true
    }
  }

  return false
}
