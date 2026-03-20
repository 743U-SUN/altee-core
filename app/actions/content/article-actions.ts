'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cuidArraySchema } from '@/lib/validations/shared'

// バリデーションスキーマ
const articleSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(255, 'スラッグは255文字以内で入力してください'),
  content: z.string().min(1, 'コンテンツは必須です'),
  excerpt: z.string().max(500, '要約は500文字以内で入力してください').optional(),
  thumbnailId: z.string().nullable().optional(),
  published: z.boolean().default(false),
})

// スラッグ生成用ヘルパー
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 255)
}

// Article作成
export async function createArticle(formData: FormData) {
  const session = await requireAdmin()
  
  const validatedFields = articleSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug') || generateSlug(formData.get('title') as string),
    content: formData.get('content'),
    excerpt: formData.get('excerpt') || undefined,
    thumbnailId: formData.get('thumbnailId') || null,
    published: formData.get('published') === 'true',
  })

  // カテゴリ・タグIDを取得・検証
  const rawCategoryIds = formData.getAll('categoryIds') as string[]
  const rawTagIds = formData.getAll('tagIds') as string[]
  const categoryIds = rawCategoryIds.length > 0 ? cuidArraySchema.parse(rawCategoryIds) : []
  const tagIds = rawTagIds.length > 0 ? cuidArraySchema.parse(rawTagIds) : []

  if (!validatedFields.success) {
    throw new Error(`バリデーションエラー: ${validatedFields.error.errors.map(e => e.message).join(', ')}`)
  }

  const { title, slug, content, excerpt, thumbnailId: rawThumbnailId, published } = validatedFields.data

  try {
    // スラッグの重複チェック
    const existingArticle = await prisma.article.findUnique({
      where: { slug }
    })

    if (existingArticle) {
      throw new Error('このスラッグは既に使用されています')
    }

    // thumbnailIdが指定されている場合、MediaFileの存在を確認（削除済みならnullにフォールバック）
    let thumbnailId = rawThumbnailId
    if (thumbnailId) {
      const mediaFile = await prisma.mediaFile.findUnique({ where: { id: thumbnailId }, select: { id: true } })
      if (!mediaFile) {
        thumbnailId = null
      }
    }

    // トランザクションで記事とカテゴリ・タグのリレーションを同時作成
    const article = await prisma.$transaction(async (tx) => {
      // 記事作成
      const newArticle = await tx.article.create({
        data: {
          title,
          slug,
          content,
          excerpt,
          thumbnailId,
          published,
          publishedAt: published ? new Date() : null,
          authorId: session.user.id,
        },
      })

      // カテゴリのリレーション作成
      if (categoryIds.length > 0) {
        await tx.articleCategory.createMany({
          data: categoryIds.map(categoryId => ({
            articleId: newArticle.id,
            categoryId,
          }))
        })
      }

      // タグのリレーション作成
      if (tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: tagIds.map(tagId => ({
            articleId: newArticle.id,
            tagId,
          }))
        })
      }

      return newArticle
    })

    revalidatePath('/admin/articles')
    revalidatePath('/admin/attributes')
    return { success: true, article }
  } catch (error) {
    console.error('Article creation error:', error)
    throw new Error(error instanceof Error ? error.message : '記事の作成に失敗しました')
  }
}

// Article更新
export async function updateArticle(id: string, formData: FormData) {
  await requireAdmin()
  
  const validatedFields = articleSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    content: formData.get('content'),
    excerpt: formData.get('excerpt') || undefined,
    thumbnailId: formData.get('thumbnailId') || null,
    published: formData.get('published') === 'true',
  })

  if (!validatedFields.success) {
    throw new Error(`バリデーションエラー: ${validatedFields.error.errors.map(e => e.message).join(', ')}`)
  }

  const { title, slug, content, excerpt, thumbnailId: rawThumbnailId, published } = validatedFields.data

  // カテゴリ・タグIDを取得・検証
  const rawCategoryIds = formData.getAll('categoryIds') as string[]
  const rawTagIds = formData.getAll('tagIds') as string[]
  const categoryIds = rawCategoryIds.length > 0 ? cuidArraySchema.parse(rawCategoryIds) : []
  const tagIds = rawTagIds.length > 0 ? cuidArraySchema.parse(rawTagIds) : []

  try {
    const existingArticle = await prisma.article.findUnique({
      where: { id }
    })

    if (!existingArticle) {
      throw new Error('記事が見つかりません')
    }

    // スラッグの重複チェック（自分以外）
    const duplicateSlug = await prisma.article.findFirst({
      where: {
        slug,
        id: { not: id }
      }
    })

    if (duplicateSlug) {
      throw new Error('このスラッグは既に使用されています')
    }

    // thumbnailIdが指定されている場合、MediaFileの存在を確認（削除済みならnullにフォールバック）
    let thumbnailId = rawThumbnailId
    if (thumbnailId) {
      const mediaFile = await prisma.mediaFile.findUnique({ where: { id: thumbnailId }, select: { id: true } })
      if (!mediaFile) {
        thumbnailId = null
      }
    }

    const wasUnpublished = !existingArticle.published
    const isNowPublished = published

    // トランザクションで記事更新とカテゴリ・タグのリレーション更新を実行
    const article = await prisma.$transaction(async (tx) => {
      // 記事更新
      const updatedArticle = await tx.article.update({
        where: { id },
        data: {
          title,
          slug,
          content,
          excerpt,
          thumbnailId,
          published,
          publishedAt: (wasUnpublished && isNowPublished) ? new Date() : existingArticle.publishedAt,
        },
      })

      // 既存のカテゴリ・タグ関連を削除
      await tx.articleCategory.deleteMany({
        where: { articleId: id }
      })
      await tx.articleTag.deleteMany({
        where: { articleId: id }
      })

      // 新しいカテゴリのリレーション作成
      if (categoryIds.length > 0) {
        await tx.articleCategory.createMany({
          data: categoryIds.map(categoryId => ({
            articleId: id,
            categoryId,
          }))
        })
      }

      // 新しいタグのリレーション作成
      if (tagIds.length > 0) {
        await tx.articleTag.createMany({
          data: tagIds.map(tagId => ({
            articleId: id,
            tagId,
          }))
        })
      }

      return updatedArticle
    })

    revalidatePath('/admin/articles')
    revalidatePath(`/admin/articles/${id}`)
    revalidatePath('/admin/attributes')
    return { success: true, article }
  } catch (error) {
    console.error('Article update error:', error)
    throw new Error(error instanceof Error ? error.message : '記事の更新に失敗しました')
  }
}

// Article削除
export async function deleteArticle(id: string) {
  await requireAdmin()

  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { thumbnail: true }
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    // サムネイルと記事をトランザクションで削除
    await prisma.$transaction(async (tx) => {
      if (article.thumbnail) {
        await tx.mediaFile.delete({
          where: { id: article.thumbnail.id }
        })
      }

      await tx.article.delete({
        where: { id }
      })
    })

    revalidatePath('/admin/articles')
    return { success: true }
  } catch (error) {
    console.error('Article deletion error:', error)
    throw new Error(error instanceof Error ? error.message : '記事の削除に失敗しました')
  }
}

// Article一覧取得
export async function getArticles(page: number = 1, limit: number = 10) {
  await requireAdmin()

  const safeLimit = Math.min(Math.max(1, limit), 100)
  const safePage = Math.max(1, page)

  try {
    const offset = (safePage - 1) * safeLimit

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        skip: offset,
        take: safeLimit,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          thumbnail: {
            select: { id: true, storageKey: true, originalName: true }
          },
          categories: {
            include: {
              category: {
                select: { id: true, name: true, slug: true, color: true }
              }
            }
          },
          tags: {
            include: {
              tag: {
                select: { id: true, name: true, slug: true, color: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.article.count()
    ])

    return {
      articles,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    }
  } catch (error) {
    console.error('Articles fetch error:', error)
    throw new Error('記事の取得に失敗しました')
  }
}

// Article詳細取得
export async function getArticle(id: string) {
  await requireAdmin()

  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        thumbnail: {
          select: { id: true, storageKey: true, originalName: true }
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true, color: true }
            }
          }
        },
        tags: {
          include: {
            tag: {
              select: { id: true, name: true, slug: true, color: true }
            }
          }
        }
      }
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    return article
  } catch (error) {
    console.error('Article fetch error:', error)
    throw new Error(error instanceof Error ? error.message : '記事の取得に失敗しました')
  }
}

// Article公開状態切り替え
export async function toggleArticlePublished(id: string) {
  await requireAdmin()

  try {
    const article = await prisma.article.findUnique({
      where: { id }
    })

    if (!article) {
      throw new Error('記事が見つかりません')
    }

    const wasUnpublished = !article.published
    const newPublished = !article.published

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        published: newPublished,
        publishedAt: (wasUnpublished && newPublished) ? new Date() : article.publishedAt,
      }
    })

    revalidatePath('/admin/articles')
    revalidatePath(`/admin/articles/${id}`)
    return { success: true, article: updatedArticle }
  } catch (error) {
    console.error('Article publish toggle error:', error)
    throw new Error(error instanceof Error ? error.message : '公開状態の切り替えに失敗しました')
  }
}