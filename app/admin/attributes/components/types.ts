// 共通型定義

export interface BaseAttribute {
  id: string
  name: string
  slug: string
  description?: string | null
  color?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Category extends BaseAttribute {
  order: number
  _count?: {
    articles: number
  }
}

export interface Tag extends BaseAttribute {
  _count?: {
    articles: number
  }
}

export interface ArticleCategory {
  id: string
  articleId: string
  categoryId: string
  createdAt: Date
}

export interface ArticleTag {
  id: string
  articleId: string
  tagId: string
  createdAt: Date
}

// API レスポンス型
export interface AttributeListResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// フォーム型
export interface AttributeFormData {
  name: string
  slug?: string
  description?: string
  color?: string
  order?: number
}

// 属性タイプの定義（将来の拡張用）
export type AttributeType = 'categories' | 'tags' | 'series' | 'difficulty' | 'formats' | 'achievements'

export interface AttributeTypeConfig {
  key: AttributeType
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  description: string
  isAvailable: boolean
  count?: number
}

// 検索・フィルタ用
export interface AttributeFilter {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'name' | 'createdAt' | 'order'
  sortOrder?: 'asc' | 'desc'
}

// エラー型
export interface AttributeError {
  field?: string
  message: string
  code?: string
}