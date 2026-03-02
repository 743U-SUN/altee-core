import type { UserNews, MediaFile } from '@prisma/client'

/** UserNews + thumbnail/bodyImage の storageKey を含む型 */
export type UserNewsWithImages = UserNews & {
  thumbnail: Pick<MediaFile, 'storageKey'> | null
  bodyImage: Pick<MediaFile, 'storageKey'> | null
}

/** NEWS セクション用データ型（空オブジェクト: データはUserNewsテーブルから直接取得） */
export type NewsSectionData = Record<string, never>

/** ユーザーニュースの制限値 */
export const USER_NEWS_LIMITS = {
  MAX_ARTICLES: 3,
  TITLE: 100,
  SLUG: 100,
  CONTENT: 10000,
} as const
