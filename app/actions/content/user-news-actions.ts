'use server'

import { prisma } from '@/lib/prisma'
import { cachedAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { USER_NEWS_LIMITS } from '@/types/user-news'

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

// スラッグ生成ヘルパー（英数字とハイフンのみ）
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, USER_NEWS_LIMITS.SLUG)
}

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
  const session = await cachedAuth()
  if (!session?.user?.id) throw new Error('Unauthorized')

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
  const session = await cachedAuth()
  if (!session?.user?.id) throw new Error('Unauthorized')

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
  const session = await cachedAuth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  // 3記事制限チェック
  const count = await prisma.userNews.count({
    where: { userId: session.user.id },
  })
  if (count >= USER_NEWS_LIMITS.MAX_ARTICLES) {
    throw new Error(`記事は最大${USER_NEWS_LIMITS.MAX_ARTICLES}つまでです`)
  }

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

  // 次の sortOrder を取得
  const maxOrder = await prisma.userNews.aggregate({
    where: { userId: session.user.id },
    _max: { sortOrder: true },
  })

  const news = await prisma.userNews.create({
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

  revalidatePath('/dashboard/news')
  return { success: true, data: news }
}

/** 記事更新 */
export async function updateUserNews(id: string, formData: FormData) {
  const session = await cachedAuth()
  if (!session?.user?.id) throw new Error('Unauthorized')

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
  return { success: true, data: news }
}

/** 記事削除 */
export async function deleteUserNews(id: string) {
  const session = await cachedAuth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  const existing = await prisma.userNews.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!existing) throw new Error('記事が見つかりません')

  await prisma.userNews.delete({ where: { id } })

  revalidatePath('/dashboard/news')
  return { success: true }
}

/** 並べ替え */
export async function reorderUserNews(ids: string[]) {
  const session = await cachedAuth()
  if (!session?.user?.id) throw new Error('Unauthorized')

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.userNews.updateMany({
        where: { id, userId: session.user.id },
        data: { sortOrder: index },
      })
    )
  )

  revalidatePath('/dashboard/news')
  return { success: true }
}

/** 公開/下書きトグル */
export async function toggleUserNewsPublished(id: string) {
  const session = await cachedAuth()
  if (!session?.user?.id) throw new Error('Unauthorized')

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
  return { success: true, data: news }
}

/** 公開ニュース一覧取得（ハンドル指定、認証不要） */
export async function getPublicNewsByHandle(handle: string) {
  const normalizedHandle = handle.startsWith('@')
    ? handle.slice(1).toLowerCase()
    : handle.toLowerCase()

  const user = await prisma.user.findUnique({
    where: { handle: normalizedHandle },
    select: { id: true, isActive: true },
  })

  if (!user || !user.isActive) return []

  return prisma.userNews.findMany({
    where: {
      userId: user.id,
      published: true,
      adminHidden: false,
    },
    orderBy: { sortOrder: 'asc' },
    include: {
      thumbnail: { select: { storageKey: true } },
    },
  })
}

/** 公開ニュース個別記事取得（ハンドル+slug、認証不要） */
export async function getPublicNewsArticle(handle: string, slug: string) {
  const normalizedHandle = handle.startsWith('@')
    ? handle.slice(1).toLowerCase()
    : handle.toLowerCase()

  const decodedSlug = decodeURIComponent(slug)

  const user = await prisma.user.findUnique({
    where: { handle: normalizedHandle },
    select: { id: true, isActive: true, characterName: true },
  })

  if (!user || !user.isActive) return null

  const news = await prisma.userNews.findFirst({
    where: {
      userId: user.id,
      slug: decodedSlug,
      published: true,
      adminHidden: false,
    },
    include: {
      thumbnail: { select: { storageKey: true } },
      bodyImage: { select: { storageKey: true } },
    },
  })

  return news ? { ...news, characterName: user.characterName } : null
}
