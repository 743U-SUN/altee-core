import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { queryHandleSchema, normalizeHandle } from '@/lib/validations/shared'
import type { UserSection } from '@/types/profile-sections'

/**
 * ダッシュボード用: ログインユーザーのニュース一覧取得
 */
export async function getDashboardNews(userId: string) {
  return prisma.userNews.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
    include: {
      thumbnail: { select: { storageKey: true } },
      bodyImage: { select: { storageKey: true } },
    },
  })
}

/**
 * ダッシュボード用: ニュースセクション取得（なければ作成）
 * UserSection には userId+page+sectionType のユニーク制約がないため findFirst + create を使用
 */
export async function getDashboardNewsSection(userId: string): Promise<UserSection> {
  const existing = await prisma.userSection.findFirst({
    where: {
      userId,
      page: 'news',
      sectionType: 'news-list',
    },
  })

  if (existing) return existing as unknown as UserSection

  return prisma.userSection.create({
    data: {
      userId,
      sectionType: 'news-list',
      page: 'news',
      title: null,
      sortOrder: 0,
      isVisible: true,
      data: {},
      settings: null as never,
    },
  }) as unknown as UserSection
}

const slugSchema = z.string().min(1).max(200)

/**
 * 公開ニュース一覧取得（ハンドル指定、認証不要）
 */
export const getPublicNewsByHandle = cache(async (handle: string) => {
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)

  const user = await prisma.user.findUnique({
    where: { handle: normalized },
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
})

/**
 * 公開ニュースセクション取得（ハンドル指定、認証不要）
 */
export const getPublicNewsSection = cache(async (handle: string): Promise<UserSection | null> => {
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)

  const user = await prisma.user.findUnique({
    where: { handle: normalized },
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
})

/**
 * 公開ニュース個別記事取得（ハンドル+slug、認証不要）
 */
export const getPublicNewsArticle = cache(async (handle: string, slug: string) => {
  const validatedHandle = queryHandleSchema.parse(handle)
  const validatedSlug = slugSchema.parse(slug)
  const normalized = normalizeHandle(validatedHandle)

  const decodedSlug = decodeURIComponent(validatedSlug)

  const user = await prisma.user.findUnique({
    where: { handle: normalized },
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
})
