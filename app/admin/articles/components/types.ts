// 記事フォーム関連の共通型定義

export interface FormValues {
  title: string
  slug: string
  content: string
  excerpt: string
  published: boolean
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  published: boolean
  createdAt: Date | string
  updatedAt: Date | string
  author?: {
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