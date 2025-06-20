// カテゴリ関連の型定義

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  order: number
  createdAt: Date
  updatedAt: Date
  _count: {
    articles: number
  }
}

export interface CategoryWithArticles extends Category {
  articles: {
    id: string
    articleId: string
    categoryId: string
    createdAt: Date
    article: {
      id: string
      title: string
      slug: string
      published: boolean
    }
  }[]
}

export interface CategoryFormData {
  name: string
  slug?: string
  description?: string
  color?: string
  order?: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CategoryListResponse {
  categories: Category[]
  pagination: Pagination
}