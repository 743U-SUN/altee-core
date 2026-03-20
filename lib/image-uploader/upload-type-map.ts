import type { MediaType } from '@prisma/client'

/** フォルダ名 → MediaType マッピング */
export const FOLDER_TO_TYPE: Record<string, MediaType> = {
  'article-thumbnails': 'THUMBNAIL',
  'article-images': 'CONTENT',
  'system-assets': 'SYSTEM',
  'user-icons': 'PROFILE',
  'backgrounds': 'BACKGROUND',
  'admin-links': 'LINK_ICON',
  'user-links': 'LINK_ICON',
  'admin-icons': 'ICON',
  'user-notifications': 'NOTIFICATION',
  'user-contacts': 'CONTACT',
  'user-news-thumbnails': 'USER_NEWS',
  'user-news-images': 'USER_NEWS',
}

/** MediaType → デフォルトフォルダ名マッピング */
export const TYPE_TO_FOLDER: Record<MediaType, string> = {
  THUMBNAIL: 'article-thumbnails',
  CONTENT: 'article-images',
  SYSTEM: 'system-assets',
  PROFILE: 'user-icons',
  BACKGROUND: 'backgrounds',
  LINK_ICON: 'user-links',
  ICON: 'admin-icons',
  NOTIFICATION: 'user-notifications',
  CONTACT: 'user-contacts',
  USER_NEWS: 'user-news-thumbnails',
}

/** 日付ベースの階層構造を使用するフォルダ一覧 */
export const DATE_HIERARCHY_FOLDERS = new Set(Object.keys(FOLDER_TO_TYPE))
