import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { cuidSchema } from '@/lib/validations/shared'

// ===== カテゴリ =====

/**
 * 管理画面用: カテゴリ一覧取得（ページネーション付き）
 */
export async function getAdminCategories(page: number = 1, limit: number = 20) {
  await requireAdmin()

  const offset = (page - 1) * limit

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    }),
    prisma.category.count(),
  ])

  return {
    categories,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 管理画面用: カテゴリ詳細取得
 */
export const getAdminCategory = cache(async (id: string) => {
  await requireAdmin()

  const validatedId = cuidSchema.parse(id)

  const category = await prisma.category.findUnique({
    where: { id: validatedId },
    include: {
      articles: {
        take: 50,
        include: {
          article: {
            select: { id: true, title: true, slug: true, published: true },
          },
        },
      },
      _count: {
        select: { articles: true },
      },
    },
  })

  if (!category) {
    throw new Error('カテゴリが見つかりません')
  }

  return category
})

/**
 * 管理画面用: 全カテゴリ取得（記事作成時のセレクタ用）
 */
export const getAdminAllCategories = cache(async () => {
  await requireAdmin()

  return prisma.category.findMany({
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
})

// ===== タグ =====

/**
 * 管理画面用: タグ一覧取得（ページネーション付き）
 */
export async function getAdminTags(page: number = 1, limit: number = 20) {
  await requireAdmin()

  const offset = (page - 1) * limit

  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      skip: offset,
      take: limit,
      include: {
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.tag.count(),
  ])

  return {
    tags,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

/**
 * 管理画面用: タグ詳細取得
 */
export const getAdminTag = cache(async (id: string) => {
  await requireAdmin()

  const validatedId = cuidSchema.parse(id)

  const tag = await prisma.tag.findUnique({
    where: { id: validatedId },
    include: {
      articles: {
        take: 50,
        include: {
          article: {
            select: { id: true, title: true, slug: true, published: true },
          },
        },
      },
      _count: {
        select: { articles: true },
      },
    },
  })

  if (!tag) {
    throw new Error('タグが見つかりません')
  }

  return tag
})

/**
 * 管理画面用: 全タグ取得（記事作成時のセレクタ用）
 */
export const getAdminAllTags = cache(async () => {
  await requireAdmin()

  return prisma.tag.findMany({
    orderBy: { name: 'asc' },
  })
})
