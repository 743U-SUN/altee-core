'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cuidSchema } from '@/lib/validations/shared'
import { generateSlug } from '@/lib/utils/slug'

// バリデーションスキーマ
const tagSchema = z.object({
  name: z.string().min(1, 'タグ名は必須です').max(50, 'タグ名は50文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(100, 'スラッグは100文字以内で入力してください'),
  description: z.string().max(200, '説明は200文字以内で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '正しいカラーコードを入力してください').optional(),
})

// タグ作成
export async function createTag(formData: FormData) {
  await requireAdmin()
  
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
    throw new Error(error instanceof Error ? error.message : 'タグの作成に失敗しました')
  }
}

// タグ更新
export async function updateTag(id: string, formData: FormData) {
  await requireAdmin()

  const validatedId = cuidSchema.parse(id)

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
      where: { id: validatedId }
    })

    if (!existingTag) {
      throw new Error('タグが見つかりません')
    }

    // スラッグの重複チェック（自分以外）
    const duplicateSlug = await prisma.tag.findFirst({
      where: {
        slug,
        id: { not: validatedId }
      }
    })

    if (duplicateSlug) {
      throw new Error('このスラッグは既に使用されています')
    }

    const tag = await prisma.tag.update({
      where: { id: validatedId },
      data: {
        name,
        slug,
        description,
        color,
      },
    })

    revalidatePath('/admin/attributes/tags')
    revalidatePath(`/admin/attributes/tags/${validatedId}`)
    revalidatePath('/admin/attributes')
    return { success: true, tag }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'タグの更新に失敗しました')
  }
}

// タグ削除
export async function deleteTag(id: string) {
  await requireAdmin()

  const validatedId = cuidSchema.parse(id)

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: validatedId },
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
      where: { id: validatedId }
    })

    revalidatePath('/admin/attributes/tags')
    revalidatePath('/admin/attributes')
    return { success: true }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'タグの削除に失敗しました')
  }
}

// タグ一覧取得
export async function getTags(page: number = 1, limit: number = 20) {
  await requireAdmin()

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
  } catch {
    throw new Error('タグの取得に失敗しました')
  }
}

// タグ詳細取得
export async function getTag(id: string) {
  await requireAdmin()

  const validatedId = cuidSchema.parse(id)

  try {
    const tag = await prisma.tag.findUnique({
      where: { id: validatedId },
      include: {
        articles: {
          take: 50,
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
    throw new Error(error instanceof Error ? error.message : 'タグの取得に失敗しました')
  }
}

// 全タグ取得（記事作成時のセレクタ用）
export async function getAllTags() {
  await requireAdmin()

  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' }
    })

    return tags
  } catch {
    throw new Error('タグの取得に失敗しました')
  }
}