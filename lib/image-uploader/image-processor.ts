import type { ImageProcessingOptions, ProcessingResult } from '@/types/image-upload'

// デフォルトの処理オプション
const DEFAULT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: 'webp'
}

// 記事コンテンツ用の処理オプション
const ARTICLE_CONTENT_OPTIONS: Required<ImageProcessingOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  format: 'webp'
}

/**
 * Canvasを使用して画像をリサイズ・変換
 */
function processImageOnCanvas(
  img: HTMLImageElement,
  options: Required<ImageProcessingOptions>
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Canvas context not available')
      }
      
      // アスペクト比を維持しながらリサイズ
      const { width, height } = calculateDimensions(
        img.width,
        img.height,
        options.maxWidth,
        options.maxHeight
      )
      
      canvas.width = width
      canvas.height = height
      
      // 高品質な描画設定
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height)
      
      // 指定されたフォーマットで出力
      const mimeType = `image/${options.format}`
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        mimeType,
        options.quality
      )
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * アスペクト比を維持しながら最適なサイズを計算
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // 元の画像が制限サイズより小さい場合はそのまま
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight }
  }
  
  const aspectRatio = originalWidth / originalHeight
  
  // 幅に合わせて計算
  let newWidth = maxWidth
  let newHeight = maxWidth / aspectRatio
  
  // 高さが制限を超える場合は高さに合わせて再計算
  if (newHeight > maxHeight) {
    newHeight = maxHeight
    newWidth = maxHeight * aspectRatio
  }
  
  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight)
  }
}

/**
 * 画像ファイルを読み込んでHTMLImageElementを作成
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * ファイル名の拡張子を変更
 */
function changeFileExtension(filename: string, newExtension: string): string {
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  return `${nameWithoutExt}.${newExtension}`
}

/**
 * 画像ファイルを処理（リサイズ・フォーマット変換）
 */
export async function processImage(
  file: File,
  options: Partial<ImageProcessingOptions> = {}
): Promise<ProcessingResult> {
  try {
    // オプションをデフォルト値とマージ
    const processingOptions = { ...DEFAULT_OPTIONS, ...options }
    
    // SVGファイルは処理しない
    if (file.type === 'image/svg+xml') {
      return {
        success: true,
        processedFile: file
      }
    }
    
    // 画像を読み込み
    const img = await loadImage(file)
    
    // 処理が必要かチェック
    const needsProcessing = 
      img.width > processingOptions.maxWidth ||
      img.height > processingOptions.maxHeight ||
      file.type !== `image/${processingOptions.format}`
    
    // 処理が不要な場合はそのまま返す
    if (!needsProcessing && processingOptions.format === 'webp' && file.type === 'image/webp') {
      return {
        success: true,
        processedFile: file
      }
    }
    
    // 画像を処理
    const processedBlob = await processImageOnCanvas(img, processingOptions)
    
    // 新しいファイル名を生成
    const newFilename = changeFileExtension(file.name, processingOptions.format)
    
    // 処理済みファイルを作成
    const processedFile = new File(
      [processedBlob],
      newFilename,
      {
        type: `image/${processingOptions.format}`,
        lastModified: Date.now()
      }
    )
    
    return {
      success: true,
      processedFile
    }
    
  } catch (error) {
    return {
      success: false,
      error: `画像処理エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * 複数の画像ファイルを並列処理
 */
export async function processImages(
  files: File[],
  options: Partial<ImageProcessingOptions> = {}
): Promise<ProcessingResult[]> {
  const promises = files.map(file => processImage(file, options))
  return Promise.all(promises)
}

/**
 * 記事コンテンツ用画像処理（1200x1200px最大）
 */
export async function processArticleImage(file: File): Promise<ProcessingResult> {
  return processImage(file, ARTICLE_CONTENT_OPTIONS)
}

/**
 * 記事コンテンツ用複数画像処理
 */
export async function processArticleImages(files: File[]): Promise<ProcessingResult[]> {
  return processImages(files, ARTICLE_CONTENT_OPTIONS)
}

/**
 * 画像情報を取得
 */
export async function getImageInfo(file: File): Promise<{
  width: number
  height: number
  aspectRatio: number
  size: number
  type: string
}> {
  const img = await loadImage(file)
  
  return {
    width: img.width,
    height: img.height,
    aspectRatio: img.width / img.height,
    size: file.size,
    type: file.type
  }
}