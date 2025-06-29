// 連絡方法機能関連の型定義

/**
 * ユーザー連絡方法データ
 */
export interface UserContact {
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
 * 連絡方法データ作成・更新用の型
 */
export interface ContactInput {
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
export interface ContactApiResponse {
  success: boolean
  data?: UserContact
  error?: string
}

/**
 * 連絡方法表示用の型（フロントエンド表示用）
 */
export interface ContactDisplay {
  isEnabled: boolean
  title?: string
  content?: string
  linkUrl?: string
  buttonText?: string
  imageUrl?: string
}

/**
 * バリデーション制約
 */
export const CONTACT_CONSTRAINTS = {
  TITLE_MAX_LENGTH: 30,
  CONTENT_MAX_LENGTH: 1000,
  URL_PATTERN: /^https:\/\/.+/,
} as const

/**
 * 連絡方法状態の型
 */
export type ContactStatus = 'loading' | 'success' | 'error'