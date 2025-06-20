// タグ関連の型定義

export interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
  createdAt: Date
  updatedAt: Date
  _count: {
    articles: number
  }
}

export interface TagWithArticles extends Tag {
  articles: {
    id: string
    articleId: string
    tagId: string
    createdAt: Date
    article: {
      id: string
      title: string
      slug: string
      published: boolean
    }
  }[]
}

export interface TagFormData {
  name: string
  slug?: string
  description?: string
  color?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TagListResponse {
  tags: Tag[]
  pagination: Pagination
}