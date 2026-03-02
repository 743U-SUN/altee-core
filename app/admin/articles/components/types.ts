// 記事管理関連の共通型定義

// フォームの入力値
export interface FormValues {
  title: string
  slug: string
  content: string
  excerpt: string
  published: boolean
}

// ページネーション
export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// カテゴリ・タグの基本型
export interface CategoryItem {
  id: string
  name: string
  slug: string
  color: string | null
}

export interface TagItem {
  id: string
  name: string
  slug: string
  color: string | null
}

// 一覧用（content なし、author 必須）
export interface ArticleSummary {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    name: string | null
    email: string
  }
  thumbnail: {
    id: string
    storageKey: string
    originalName: string
  } | null
}

// フォーム用（content あり、categories/tags 含む）
export interface ArticleDetail extends ArticleSummary {
  content: string
  categories?: {
    id: string
    categoryId: string
    category: CategoryItem
  }[]
  tags?: {
    id: string
    tagId: string
    tag: TagItem
  }[]
}
