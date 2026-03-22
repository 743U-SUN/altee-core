'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { invalidateUserCacheTags } from '@/lib/cache-utils'
import { USER_NEWS_LIMITS } from '@/types/user-news'
import type { SectionSettings } from '@/types/profile-sections'
import { sectionSettingsSchema } from '@/lib/validations/section-settings'
import { generateSlug } from '@/lib/utils/slug'

// バリデーションスキーマ
const userNewsSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(USER_NEWS_LIMITS.TITLE, `タイトルは${USER_NEWS_LIMITS.TITLE}文字以内で入力してください`),
  slug: z
    .string()
    .min(1, 'スラッグは必須です')
    .max(USER_NEWS_LIMITS.SLUG, `スラッグは${USER_NEWS_LIMITS.SLUG}文字以内で入力してください`)
    .regex(/^[a-z0-9-]+$/, '英小文字・数字・ハイフンのみ使用できます'),
  excerpt: z
    .string()
    .max(USER_NEWS_LIMITS.EXCERPT, `要約は${USER_NEWS_LIMITS.EXCERPT}文字以内で入力してください`)
    .default(''),
  content: z
    .string()
    .max(USER_NEWS_LIMITS.CONTENT, `本文は${USER_NEWS_LIMITS.CONTENT}文字以内で入力してください`)
    .default(''),
  thumbnailId: z.string().nullable().optional(),
  bodyImageId: z.string().nullable().optional(),
  published: z.boolean().default(false),
})

// 同一ユーザー内でスラッグの重複を回避
async function ensureUniqueSlug(
  userId: string,
  slug: string,
  excludeId?: string
): Promise<string> {
  let candidate = slug
  let suffix = 2

  while (true) {
    const existing = await prisma.userNews.findFirst({
      where: {
        userId,
        slug: candidate,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
    if (!existing) return candidate
    candidate = `${slug}-${suffix}`
    suffix++
    if (suffix > 100) throw new Error('スラッグの生成に失敗しました')
  }
}

/** 自分の全記事を取得（下書き含む） */
export async function getUserNews() {
  const session = await requireAuth()

  const news = await prisma.userNews.findMany({
    where: { userId: session.user.id },
    orderBy: { sortOrder: 'asc' },
    include: {
      thumbnail: { select: { storageKey: true } },
      bodyImage: { select: { storageKey: true } },
    },
  })

  return { success: true, data: news }
}

/** 編集画面用: IDで記事取得 */
export async function getUserNewsById(id: string) {
  const session = await requireAuth()

  const news = await prisma.userNews.findFirst({
    where: { id, userId: session.user.id },
    include: {
      thumbnail: { select: { storageKey: true } },
      bodyImage: { select: { storageKey: true } },
    },
  })

  if (!news) throw new Error('記事が見つかりません')
  return { success: true, data: news }
}

/** 記事作成 */
export async function createUserNews(formData: FormData) {
  const session = await requireAuth()

  const rawSlug =
    (formData.get('slug') as string) ||
    generateSlug(formData.get('title') as string)

  const validatedFields = userNewsSchema.safeParse({
    title: formData.get('title'),
    slug: rawSlug,
    excerpt: formData.get('excerpt') || '',
    content: formData.get('content') || '',
    thumbnailId: formData.get('thumbnailId') || null,
    bodyImageId: formData.get('bodyImageId') || null,
    published: formData.get('published') === 'true',
  })

  if (!validatedFields.success) {
    throw new Error(
      `バリデーションエラー: ${validatedFields.error.errors.map((e) => e.message).join(', ')}`
    )
  }

  const { title, slug, excerpt, content, thumbnailId, bodyImageId, published } =
    validatedFields.data

  const uniqueSlug = await ensureUniqueSlug(session.user.id, slug)

  // count+create をトランザクションで実行（TOCTOU防止）
  let news
  try {
    news = await prisma.$transaction(async (tx) => {
      const count = await tx.userNews.count({
        where: { userId: session.user.id },
      })
      if (count >= USER_NEWS_LIMITS.MAX_ARTICLES) {
        throw new Error(`記事は最大${USER_NEWS_LIMITS.MAX_ARTICLES}つまでです`)
      }

      const maxOrder = await tx.userNews.aggregate({
        where: { userId: session.user.id },
        _max: { sortOrder: true },
      })

      return tx.userNews.create({
        data: {
          userId: session.user.id,
          title,
          slug: uniqueSlug,
          excerpt,
          content,
          thumbnailId: thumbnailId || null,
          bodyImageId: bodyImageId || null,
          published,
          sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        },
      })
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      throw new Error('このスラッグは既に使用されています')
    }
    throw error
  }

  revalidatePath('/dashboard/news')
  invalidateUserCacheTags(session.user.handle, ['news', 'profile'])
  return { success: true, data: news }
}

/** 記事更新 */
export async function updateUserNews(id: string, formData: FormData) {
  const session = await requireAuth()

  // 所有者チェック
  const existing = await prisma.userNews.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!existing) throw new Error('記事が見つかりません')

  const rawSlug =
    (formData.get('slug') as string) ||
    generateSlug(formData.get('title') as string)

  const validatedFields = userNewsSchema.safeParse({
    title: formData.get('title'),
    slug: rawSlug,
    excerpt: formData.get('excerpt') || '',
    content: formData.get('content') || '',
    thumbnailId: formData.get('thumbnailId') || null,
    bodyImageId: formData.get('bodyImageId') || null,
    published: formData.get('published') === 'true',
  })

  if (!validatedFields.success) {
    throw new Error(
      `バリデーションエラー: ${validatedFields.error.errors.map((e) => e.message).join(', ')}`
    )
  }

  const { title, slug, excerpt, content, thumbnailId, bodyImageId, published } =
    validatedFields.data

  const uniqueSlug = await ensureUniqueSlug(session.user.id, slug, id)

  const news = await prisma.userNews.update({
    where: { id },
    data: {
      title,
      slug: uniqueSlug,
      excerpt,
      content,
      thumbnailId: thumbnailId || null,
      bodyImageId: bodyImageId || null,
      published,
    },
  })

  revalidatePath('/dashboard/news')
  invalidateUserCacheTags(session.user.handle, ['news', 'profile'])
  return { success: true, data: news }
}

/** 記事削除 */
export async function deleteUserNews(id: string) {
  const session = await requireAuth()

  const existing = await prisma.userNews.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!existing) throw new Error('記事が見つかりません')

  await prisma.userNews.delete({ where: { id } })

  revalidatePath('/dashboard/news')
  invalidateUserCacheTags(session.user.handle, ['news', 'profile'])
  return { success: true }
}

/** 並べ替え */
export async function reorderUserNews(ids: string[]) {
  const session = await requireAuth()

  const reorderSchema = z.array(z.string().cuid()).min(1).max(100)
  const validatedIds = reorderSchema.parse(ids)

  await prisma.$transaction(
    validatedIds.map((id, index) =>
      prisma.userNews.updateMany({
        where: { id, userId: session.user.id },
        data: { sortOrder: index },
      })
    )
  )

  revalidatePath('/dashboard/news')
  invalidateUserCacheTags(session.user.handle, ['news', 'profile'])
  return { success: true }
}

/** 公開/下書きトグル */
export async function toggleUserNewsPublished(id: string) {
  const session = await requireAuth()

  const existing = await prisma.userNews.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, published: true },
  })
  if (!existing) throw new Error('記事が見つかりません')

  const news = await prisma.userNews.update({
    where: { id },
    data: { published: !existing.published },
  })

  revalidatePath('/dashboard/news')
  invalidateUserCacheTags(session.user.handle, ['news', 'profile'])
  return { success: true, data: news }
}

// 公開ニュース取得関数はlib/queries/news-queries.tsに移動済み
// クライアントコンポーネントから呼び出す場合はServer Action経由のラッパーを使用
import { getPublicNewsByHandle as getPublicNewsByHandleQuery } from '@/lib/queries/news-queries'

/** 公開ニュース一覧取得（クライアントコンポーネント用Server Actionラッパー） */
export async function getPublicNewsByHandle(handle: string) {
  return getPublicNewsByHandleQuery(handle)
}

/** ニュースリストセクションのスタイル設定を更新 */
export async function updateNewsListSettings(
  sectionId: string,
  settings: SectionSettings | null
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()

  try {

    // settingsのバリデーション（nullの場合はスキップ）
    if (settings !== null) {
      const parsed = sectionSettingsSchema.safeParse(settings)
      if (!parsed.success) {
        return { success: false, error: 'スタイル設定が無効です: ' + parsed.error.errors.map(e => e.message).join(', ') }
      }
    }

    const section = await prisma.userSection.findUnique({
      where: { id: sectionId },
      select: { userId: true },
    })

    if (!section || section.userId !== session.user.id) {
      return { success: false, error: 'セクションが見つかりません' }
    }

    await prisma.userSection.update({
      where: { id: sectionId },
      data: { settings: settings as never },
    })

    revalidatePath(`/@${session.user.handle}/news`)
    revalidatePath('/dashboard/news')
    invalidateUserCacheTags(session.user.handle, ['news', 'profile'])
    return { success: true }
  } catch {
    return { success: false, error: 'スタイルの更新に失敗しました' }
  }
}

// getPublicNewsSection, getPublicNewsArticle はlib/queries/news-queries.tsに移動済み
