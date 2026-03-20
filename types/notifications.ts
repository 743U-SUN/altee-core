// 通知機能関連の型定義

import type { AttachedImage } from "@/types/media"

/**
 * ユーザー通知データ
 */
export interface UserNotification {
  id: string
  userId: string
  isEnabled: boolean
  title?: string | null
  content?: string | null
  linkUrl?: string | null
  buttonText?: string | null
  imageId?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  image?: AttachedImage | null
}

/**
 * 通知データ作成・更新用の型
 */
export interface NotificationInput {
  isEnabled: boolean
  title?: string
  content?: string
  linkUrl?: string
  buttonText?: string
  imageId?: string
}

/**
 * Cookie管理用の型
 */
export interface NotificationCookie {
  userId: string
  lastReadAt: string
}

/**
 * バリデーション制約
 */
export const NOTIFICATION_CONSTRAINTS = {
  TITLE_MAX_LENGTH: 30,
  CONTENT_MAX_LENGTH: 1000,
  URL_PATTERN: /^https:\/\/.+/,
  COOKIE_EXPIRES_DAYS: 30,
} as const
