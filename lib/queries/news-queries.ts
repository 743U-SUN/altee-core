import 'server-only'
import { cache } from 'react'
import { cacheLife, cacheTag } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { queryHandleSchema, normalizeHandle, cuidSchema } from '@/lib/validations/shared'
import type { UserSection } from '@/types/profile-sections'

/**
 * ダッシュボード用: IDでニュース記事取得（所有者チェック付き）
 */
export const getDashboardNewsById = cache(async (id: string, userId: string) => {
  const validatedId = cuidSchema.parse(id)
  const news = await prisma.userNews.findFirst({
    where: { id: validatedId, userId },
    include: {
      thumbnail: { select: { storageKey: true } },
      bodyImage: { select: { storageKey: true } },
    },
  })
  if (!news) throw new Error('記事が見つかりません')
  return { success: true as const, data: news }
})

/**
 * ダッシュボード用: ログインユーザーのニュース一覧取得
 */
export const getDashboardNews = cache(async (userId: string) => {
  return prisma.userNews.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
    include: {
      thumbnail: { select: { storageKey: true } },
      bodyImage: { select: { storageKey: true } },
    },
  })
})

/**
 * Prisma の JsonValue 型を UserSection の settings 型に変換
 */
function toUserSection(row: {
  id: string
  userId: string
  sectionType: string
  title: string | null
  page: string
  sortOrder: number
  isVisible: boolean
  data: unknown
  settings: unknown
  createdAt: Date
  updatedAt: Date
}): UserSection {
  return row as UserSection
}

/**
 * ダッシュボード用: ニュースセクション取得（なければ作成）
 * findFirst + create をトランザクションでラップして重複作成を防止
 */
export const getDashboardNewsSection = cache(async (userId: string): Promise<UserSection> => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.userSection.findFirst({
      where: {
        userId,
        page: 'news',
        sectionType: 'news-list',
      },
    })

    if (existing) return toUserSection(existing)

    const created = await tx.userSection.create({
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
    })

    return toUserSection(created)
  })
})

const slugSchema = z.string().min(1).max(200)

/**
 * ハンドルからユーザー基本情報を取得（リクエスト内重複排除用）
 */
const getActiveUserByHandle = cache(async (normalized: string) => {
  return prisma.user.findUnique({
    where: { handle: normalized },
    select: { id: true, isActive: true },
  })
})

/**
 * 公開ニュース一覧取得（ハンドル指定、認証不要）
 * 'use cache' でクロスリクエストキャッシュ
 */
export async function getPublicNewsByHandle(handle: string) {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`news-${normalized}`)

  const user = await getActiveUserByHandle(normalized)
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
 * 'use cache' でクロスリクエストキャッシュ
 */
export async function getPublicNewsSection(handle: string): Promise<UserSection | null> {
  'use cache'
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`news-${normalized}`)

  const user = await getActiveUserByHandle(normalized)
  if (!user || !user.isActive) return null

  const section = await prisma.userSection.findFirst({
    where: {
      userId: user.id,
      page: 'news',
      sectionType: 'news-list',
      isVisible: true,
    },
  })

  return section ? toUserSection(section) : null
}

/**
 * 公開ニュース個別記事取得（ハンドル+slug、認証不要）
 * 'use cache' でクロスリクエストキャッシュ
 */
export async function getPublicNewsArticle(handle: string, slug: string) {
  'use cache'
  // decode BEFORE validation so the validated value matches what's stored in DB
  const decodedSlug = decodeURIComponent(slug)
  const validatedSlug = slugSchema.parse(decodedSlug)
  const validatedHandle = queryHandleSchema.parse(handle)
  const normalized = normalizeHandle(validatedHandle)
  cacheLife('minutes')
  cacheTag(`news-${normalized}`)

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
      slug: validatedSlug,
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
