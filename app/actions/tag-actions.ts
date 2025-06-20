'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// バリデーションスキーマ
const tagSchema = z.object({
  name: z.string().min(1, 'タグ名は必須です').max(50, 'タグ名は50文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(100, 'スラッグは100文字以内で入力してください'),
  description: z.string().max(200, '説明は200文字以内で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '正しいカラーコードを入力してください').optional(),
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

// タグ作成
export async function createTag(formData: FormData) {
  await requireAdminAuth()
  
  const validatedFields = tagSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || generateSlug(formData.get('name') as string),
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
  })

  if (!validatedFields.success) {
    throw new Error(`バリデーションエラー: ${validatedFields.error.errors.map(e => e.message).join(', ')}`)
  }

  const { name, slug, description, color } = validatedFields.data

  try {
    // スラッグの重複チェック
    const existingTag = await prisma.tag.findUnique({
      where: { slug }
    })

    if (existingTag) {
      throw new Error('このスラッグは既に使用されています')
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        description,
        color,
      },
    })

    revalidatePath('/admin/attributes/tags')
    revalidatePath('/admin/attributes')
    return { success: true, tag }
  } catch (error) {
    console.error('Tag creation error:', error)
    throw new Error(error instanceof Error ? error.message : 'タグの作成に失敗しました')
  }
}

// タグ更新
export async function updateTag(id: string, formData: FormData) {
  await requireAdminAuth()
  
  const validatedFields = tagSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description') || undefined,
    color: formData.get('color') || undefined,
  })

  if (!validatedFields.success) {
    throw new Error(`バリデーションエラー: ${validatedFields.error.errors.map(e => e.message).join(', ')}`)
  }

  const { name, slug, description, color } = validatedFields.data

  try {
    const existingTag = await prisma.tag.findUnique({
      where: { id }
    })

    if (!existingTag) {
      throw new Error('タグが見つかりません')
    }

    // スラッグの重複チェック（自分以外）
    const duplicateSlug = await prisma.tag.findFirst({
      where: { 
        slug,
        id: { not: id }
      }
    })

    if (duplicateSlug) {
      throw new Error('このスラッグは既に使用されています')
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        color,
      },
    })

    revalidatePath('/admin/attributes/tags')
    revalidatePath(`/admin/attributes/tags/${id}`)
    revalidatePath('/admin/attributes')
    return { success: true, tag }
  } catch (error) {
    console.error('Tag update error:', error)
    throw new Error(error instanceof Error ? error.message : 'タグの更新に失敗しました')
  }
}

// タグ削除
export async function deleteTag(id: string) {
  await requireAdminAuth()

  try {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: { 
        articles: { 
          include: { article: true }
        }
      }
    })

    if (!tag) {
      throw new Error('タグが見つかりません')
    }

    // 記事に紐づいている場合は削除不可
    if (tag.articles.length > 0) {
      throw new Error(`このタグは${tag.articles.length}件の記事で使用されているため削除できません`)
    }

    await prisma.tag.delete({
      where: { id }
    })

    revalidatePath('/admin/attributes/tags')
    revalidatePath('/admin/attributes')
    return { success: true }
  } catch (error) {
    console.error('Tag deletion error:', error)
    throw new Error(error instanceof Error ? error.message : 'タグの削除に失敗しました')
  }
}

// タグ一覧取得
export async function getTags(page: number = 1, limit: number = 20) {
  await requireAdminAuth()

  try {
    const offset = (page - 1) * limit

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        skip: offset,
        take: limit,
        include: {
          _count: {
            select: { articles: true }
          }
        },
        orderBy: { name: 'asc' }
      }),
      prisma.tag.count()
    ])

    return {
      tags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  } catch (error) {
    console.error('Tags fetch error:', error)
    throw new Error('タグの取得に失敗しました')
  }
}

// タグ詳細取得
export async function getTag(id: string) {
  await requireAdminAuth()

  try {
    const tag = await prisma.tag.findUnique({
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

    if (!tag) {
      throw new Error('タグが見つかりません')
    }

    return tag
  } catch (error) {
    console.error('Tag fetch error:', error)
    throw new Error(error instanceof Error ? error.message : 'タグの取得に失敗しました')
  }
}

// 全タグ取得（記事作成時のセレクタ用）
export async function getAllTags() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })

    return tags
  } catch (error) {
    console.error('All tags fetch error:', error)
    throw new Error('タグの取得に失敗しました')
  }
}