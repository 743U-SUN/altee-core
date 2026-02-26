// ギフト設定機能関連の型定義

/**
 * ユーザーギフト設定データ
 */
export interface UserGift {
  id: string
  userId: string
  isEnabled: boolean
  imageId?: string | null
  linkUrl?: string | null
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
 * ギフト設定データ作成・更新用の型
 */
export interface GiftInput {
  isEnabled: boolean
  imageId?: string
  linkUrl?: string
}

/**
 * APIレスポンス用の型
 */
export interface GiftApiResponse {
  success: boolean
  data?: UserGift
  error?: string
}

/**
 * ギフト設定表示用の型（フロントエンド表示用）
 */
export interface GiftDisplay {
  isEnabled: boolean
  imageUrl?: string
  linkUrl?: string
}

/**
 * バリデーション制約
 */
export const GIFT_CONSTRAINTS = {
  URL_PATTERN: /^https:\/\/.+/,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const
