// ギフト設定機能関連の型定義

import type { AttachedImage } from "@/types/media"

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
  image?: AttachedImage | null
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
 * バリデーション制約
 */
export const GIFT_CONSTRAINTS = {
  URL_PATTERN: /^https:\/\/.+/,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const
