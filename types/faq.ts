import { SortableParentItem, SortableChildItem } from '@/components/sortable-list/types'

// Prismaから生成される基本型
export interface FaqCategoryBase {
  id: string
  userId: string
  name: string
  description: string | null
  sortOrder: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FaqQuestionBase {
  id: string
  categoryId: string
  question: string
  answer: string
  sortOrder: number
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

// ソート可能コンポーネント用の型（SortableParentItem/SortableChildItemを継承）
export interface FaqCategory extends SortableParentItem {
  userId: string
  name: string
  description: string | null
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FaqQuestion extends SortableChildItem {
  categoryId: string // parentIdとして使用
  question: string
  answer: string
  isVisible: boolean
  createdAt: Date
  updatedAt: Date
}

// Server Actions用の入力型
export interface CreateFaqCategoryData {
  name: string
  description?: string
}

export interface UpdateFaqCategoryData {
  name?: string
  description?: string
  isVisible?: boolean
}

export interface CreateFaqQuestionData {
  question: string
  answer: string
}

export interface UpdateFaqQuestionData {
  question?: string
  answer?: string
  isVisible?: boolean
}

// Server Actions用のレスポンス型
export interface FaqActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// バリデーション設定
export const FAQ_LIMITS = {
  CATEGORY: {
    MAX_COUNT: 10,
    NAME_MAX_LENGTH: 30,
    DESCRIPTION_MAX_LENGTH: 200,
  },
  QUESTION: {
    MAX_COUNT_PER_CATEGORY: 50,
    QUESTION_MAX_LENGTH: 30,
    ANSWER_MAX_LENGTH: 1000,
  },
} as const

// バリデーション関数型
export type FaqValidationFunction = (value: string) => string | null