// 通知機能関連の型定義

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
  image?: {
    id: string
    storageKey: string
    originalName: string
    mimeType: string
  } | null
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
 * APIレスポンス用の型
 */
export interface NotificationApiResponse {
  success: boolean
  data?: UserNotification
  error?: string
}

/**
 * 通知表示用の型（フロントエンド表示用）
 */
export interface NotificationDisplay {
  isEnabled: boolean
  title?: string
  content?: string
  linkUrl?: string
  buttonText?: string
  imageUrl?: string
  hasUnread: boolean
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

/**
 * 通知状態の型
 */
export type NotificationStatus = 'loading' | 'success' | 'error'