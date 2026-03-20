import { MediaType } from "@prisma/client"

export interface AttachedImage {
  id: string
  storageKey: string
  originalName: string
  mimeType: string
}

export interface AdminMediaFileView {
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
  } | null
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
