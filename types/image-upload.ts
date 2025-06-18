// 画像アップロード関連の型定義

export type SupportedImageFormat = 'gif' | 'jpg' | 'jpeg' | 'png' | 'webp' | 'svg'

export type PreviewSize = 'small' | 'medium' | 'large' | 'custom'

export type DeleteButtonPosition = 'overlay' | 'external' | 'auto'

export type UploadMode = 'immediate' | 'batch'

export interface CustomSize {
  width: number
  height: number
}

export interface UploadedFile {
  id: string
  name: string
  originalName: string
  url: string
  key: string
  size: number
  type: string
  uploadedAt: string
  file?: File // batchモード用の元ファイルオブジェクト
}


export interface ImageUploaderProps {
  mode: UploadMode
  previewSize: PreviewSize | CustomSize
  deleteButtonPosition?: DeleteButtonPosition
  maxFiles?: number
  maxSize?: number // bytes
  rounded?: boolean
  className?: string
  disabled?: boolean
  folder?: string // 保存先フォルダ（デフォルト: 'images'）
  value?: UploadedFile[]
  onUpload?: (files: UploadedFile[]) => void
  onDelete?: (fileId: string) => void
  onError?: (error: string) => void
}

export interface ImageProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  fileType?: SupportedImageFormat
}

export interface ProcessingResult {
  success: boolean
  processedFile?: File
  error?: string
}