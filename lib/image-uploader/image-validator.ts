import type { SupportedImageFormat, ValidationResult } from '@/types/image-upload'

// サポートされている画像形式
const SUPPORTED_FORMATS: SupportedImageFormat[] = ['gif', 'jpg', 'jpeg', 'png', 'webp', 'svg']

// MIMEタイプとファイル拡張子のマッピング
const MIME_TYPE_MAP: Record<string, SupportedImageFormat> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

// ファイル拡張子からフォーマットを取得
function getFileFormat(filename: string): SupportedImageFormat | null {
  const extension = filename.toLowerCase().split('.').pop()
  if (!extension) return null
  
  const format = extension as SupportedImageFormat
  return SUPPORTED_FORMATS.includes(format) ? format : null
}

// MIMEタイプからフォーマットを取得
function getMimeFormat(mimeType: string): SupportedImageFormat | null {
  return MIME_TYPE_MAP[mimeType.toLowerCase()] || null
}

// ファイルサイズをチェック
function validateFileSize(file: File, maxSize?: number): boolean {
  if (!maxSize) return true
  return file.size <= maxSize
}

// ファイル形式をチェック
function validateFileFormat(file: File): { isValid: boolean; format?: SupportedImageFormat } {
  // MIMEタイプでチェック
  const mimeFormat = getMimeFormat(file.type)
  if (mimeFormat) {
    return { isValid: true, format: mimeFormat }
  }
  
  // ファイル拡張子でチェック
  const fileFormat = getFileFormat(file.name)
  if (fileFormat) {
    return { isValid: true, format: fileFormat }
  }
  
  return { isValid: false }
}

// メイン検証関数
export function validateImageFile(file: File, maxSize?: number): ValidationResult {
  try {
    // ファイルサイズチェック
    if (!validateFileSize(file, maxSize)) {
      const maxSizeMB = maxSize ? (maxSize / 1024 / 1024).toFixed(1) : 'unknown'
      return {
        isValid: false,
        error: `ファイルサイズが大きすぎます。最大${maxSizeMB}MBまでです。`
      }
    }
    
    // ファイル形式チェック
    const formatResult = validateFileFormat(file)
    if (!formatResult.isValid) {
      return {
        isValid: false,
        error: `サポートされていないファイル形式です。対応形式: ${SUPPORTED_FORMATS.join(', ')}`
      }
    }
    
    return {
      isValid: true,
      fileType: formatResult.format
    }
    
  } catch (error) {
    return {
      isValid: false,
      error: `ファイル検証エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// 複数ファイルの検証
export function validateImageFiles(files: File[], maxFiles?: number, maxSize?: number): ValidationResult[] {
  // ファイル数チェック
  if (maxFiles && files.length > maxFiles) {
    return files.map((_, index) => ({
      isValid: index < maxFiles,
      error: index >= maxFiles ? `最大${maxFiles}ファイルまでです。` : undefined
    }))
  }
  
  // 各ファイルを検証
  return files.map(file => validateImageFile(file, maxSize))
}

// ファイルサイズを人間が読みやすい形式に変換
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}