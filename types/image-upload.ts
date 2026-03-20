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
  showPreview?: boolean // プレビュー表示の制御（デフォルト: true）
  imageProcessingOptions?: ImageProcessingOptions // 画像処理オプション（immediateモードのみ。未指定時は1920x1080）
  sequentialProcessing?: boolean // trueの場合、画像を順次処理（メモリ節約用）
}

export interface ImageUploaderRef {
  getFiles: () => UploadedFile[]
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