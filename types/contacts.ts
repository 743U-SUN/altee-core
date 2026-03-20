// 連絡方法機能関連の型定義

import type { AttachedImage } from "@/types/media"

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
  image?: AttachedImage | null
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
 * バリデーション制約
 */
export const CONTACT_CONSTRAINTS = {
  TITLE_MAX_LENGTH: 30,
  CONTENT_MAX_LENGTH: 1000,
  URL_PATTERN: /^https:\/\/.+/,
} as const
