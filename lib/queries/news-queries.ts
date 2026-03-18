import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { UserSection } from '@/types/profile-sections'

const handleSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, '不正なハンドルです')
const slugSchema = z.string().min(1).max(200)

/**
 * 公開ニュース一覧取得（ハンドル指定、認証不要）
 */
export async function getPublicNewsByHandle(handle: string) {
  const validatedHandle = handleSchema.parse(handle)

  const normalizedHandle = validatedHandle.startsWith('@')
    ? validatedHandle.slice(1).toLowerCase()
    : validatedHandle.toLowerCase()

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

/**
 * 公開ニュースセクション取得（ハンドル指定、認証不要）
 */
export async function getPublicNewsSection(handle: string): Promise<UserSection | null> {
  const validatedHandle = handleSchema.parse(handle)

  const normalizedHandle = validatedHandle.startsWith('@')
    ? validatedHandle.slice(1).toLowerCase()
    : validatedHandle.toLowerCase()

  const user = await prisma.user.findUnique({
    where: { handle: normalizedHandle },
    select: { id: true, isActive: true },
  })

  if (!user || !user.isActive) return null

  const section = await prisma.userSection.findFirst({
    where: {
      userId: user.id,
      page: 'news',
      sectionType: 'news-list',
      isVisible: true,
    },
  })

  return section as UserSection | null
}

/**
 * 公開ニュース個別記事取得（ハンドル+slug、認証不要）
 */
export async function getPublicNewsArticle(handle: string, slug: string) {
  const validatedHandle = handleSchema.parse(handle)
  const validatedSlug = slugSchema.parse(slug)

  const normalizedHandle = validatedHandle.startsWith('@')
    ? validatedHandle.slice(1).toLowerCase()
    : validatedHandle.toLowerCase()

  const decodedSlug = decodeURIComponent(validatedSlug)

  const user = await prisma.user.findUnique({
    where: { handle: normalizedHandle },
    select: {
      id: true,
      isActive: true,
      characterInfo: { select: { characterName: true } },
    },
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

  return news ? { ...news, characterName: user.characterInfo?.characterName ?? null } : null
}
