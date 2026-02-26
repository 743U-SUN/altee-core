'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// バリデーションスキーマ
const categorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名は必須です').max(50, 'カテゴリ名は50文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(100, 'スラッグは100文字以内で入力してください'),
  description: z.string().max(200, '説明は200文字以内で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '正しいカラーコードを入力してください').optional(),
  order: z.number().int().min(0).optional(),
})

// 管理者権限チェック
async function requireAdminAuth() {
  const session = await auth()
  
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('管理者権限が必要です')
  }
  
  return session
}

// スラッグ生成用ヘルパー
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

// カテゴリ作成
export async function createCategory(formData: FormData) {
  await requireAdminAuth()
  
  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || generateSlug(formData.get('name') as string),
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
    order: parseInt(formData.get('order') as string) || 0,
  })

  if (!validatedFields.success) {
    throw new Error(`バリデーションエラー: ${validatedFields.error.errors.map(e => e.message).join(', ')}`)
  }

  const { name, slug, description, color, order } = validatedFields.data

  try {
    // スラッグの重複チェック
    const existingCategory = await prisma.category.findUnique({
      where: { slug }
    })

    if (existingCategory) {
      throw new Error('このスラッグは既に使用されています')
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        color,
        order,
      },
    })

    revalidatePath('/admin/attributes/categories')
    revalidatePath('/admin/attributes')
    return { success: true, category }
  } catch (error) {
    console.error('Category creation error:', error)
    throw new Error(error instanceof Error ? error.message : 'カテゴリの作成に失敗しました')
  }
}

// カテゴリ更新
export async function updateCategory(id: string, formData: FormData) {
  await requireAdminAuth()
  
  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
    order: parseInt(formData.get('order') as string) || 0,
  })

  if (!validatedFields.success) {
    throw new Error(`バリデーションエラー: ${validatedFields.error.errors.map(e => e.message).join(', ')}`)
  }

  const { name, slug, description, color, order } = validatedFields.data

  try {
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    })

    if (!existingCategory) {
      throw new Error('カテゴリが見つかりません')
    }

    // スラッグの重複チェック（自分以外）
    const duplicateSlug = await prisma.category.findFirst({
      where: { 
        slug,
        id: { not: id }
      }
    })

    if (duplicateSlug) {
      throw new Error('このスラッグは既に使用されています')
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        color,
        order,
      },
    })

    revalidatePath('/admin/attributes/categories')
    revalidatePath(`/admin/attributes/categories/${id}`)
    revalidatePath('/admin/attributes')
    return { success: true, category }
  } catch (error) {
    console.error('Category update error:', error)
    throw new Error(error instanceof Error ? error.message : 'カテゴリの更新に失敗しました')
  }
}

// カテゴリ削除
export async function deleteCategory(id: string) {
  await requireAdminAuth()

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { 
        articles: { 
          include: { article: true }
        }
      }
    })

    if (!category) {
      throw new Error('カテゴリが見つかりません')
    }

    // 記事に紐づいている場合は削除不可
    if (category.articles.length > 0) {
      throw new Error(`このカテゴリは${category.articles.length}件の記事で使用されているため削除できません`)
    }

    await prisma.category.delete({
      where: { id }
    })

    revalidatePath('/admin/attributes/categories')
    revalidatePath('/admin/attributes')
    return { success: true }
  } catch (error) {
    console.error('Category deletion error:', error)
    throw new Error(error instanceof Error ? error.message : 'カテゴリの削除に失敗しました')
  }
}

// カテゴリ一覧取得
export async function getCategories(page: number = 1, limit: number = 20) {
  await requireAdminAuth()

  try {
    const offset = (page - 1) * limit

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: { articles: true }
          }
        },
        orderBy: [
          { order: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.category.count()
    ])

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Categories fetch error:', error)
    throw new Error('カテゴリの取得に失敗しました')
  }
}

// カテゴリ詳細取得
export async function getCategory(id: string) {
  await requireAdminAuth()

  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        articles: {
          include: {
            article: {
              select: { id: true, title: true, slug: true, published: true }
            }
          }
        },
        _count: {
          select: { articles: true }
        }
      }
    })

    if (!category) {
      throw new Error('カテゴリが見つかりません')
    }

    return category
  } catch (error) {
    console.error('Category fetch error:', error)
    throw new Error(error instanceof Error ? error.message : 'カテゴリの取得に失敗しました')
  }
}

// 全カテゴリ取得（記事作成時のセレクタ用）
export async function getAllCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    })

    return categories
  } catch (error) {
    console.error('All categories fetch error:', error)
    throw new Error('カテゴリの取得に失敗しました')
  }
}