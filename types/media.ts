import { MediaType } from "@prisma/client"

export interface MediaFile {
  id: string
  storageKey: string
  containerName: string
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadType: MediaType
  createdAt: string
  uploader: {
    id: string
    name: string | null
    email: string
  }
  articles: {
    id: string
    title: string
    slug: string
  }[]
}

export interface MediaPaginationData {
  total: number
  page: number
  limit: number
  totalPages: number
}
