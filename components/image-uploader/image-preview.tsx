'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UploadedFile, PreviewSize, DeleteButtonPosition, CustomSize } from '@/types/image-upload'

interface ImagePreviewProps {
  file: UploadedFile
  previewSize: PreviewSize | CustomSize
  deleteButtonPosition: DeleteButtonPosition
  rounded?: boolean
  onDelete: (fileId: string) => void
  className?: string
}

export function ImagePreview({
  file,
  previewSize,
  deleteButtonPosition,
  rounded = false,
  onDelete,
  className
}: ImagePreviewProps) {
  const [imageError, setImageError] = useState(false)

  // プレビューサイズを計算
  const getDimensions = () => {
    if (typeof previewSize === 'object') {
      return { width: previewSize.width, height: previewSize.height }
    }
    
    const sizeMap: Record<PreviewSize, { width: number; height: number }> = {
      small: { width: 64, height: 64 },
      medium: { width: 160, height: 160 },
      large: { width: 320, height: 240 },
      custom: { width: 160, height: 160 } // デフォルト値（実際は使われない）
    }
    
    return sizeMap[previewSize]
  }

  const dimensions = getDimensions()
  
  // 削除ボタンの位置を決定
  const getDeletePosition = (): 'overlay' | 'external' => {
    if (deleteButtonPosition === 'auto') {
      return dimensions.width <= 80 ? 'external' : 'overlay'
    }
    return deleteButtonPosition
  }

  const deletePosition = getDeletePosition()

  const handleDelete = () => {
    onDelete(file.id)
  }

  const previewContent = (
    <div
      className={cn(
        'relative bg-gray-100 border border-gray-200 overflow-hidden',
        rounded ? 'rounded-full' : 'rounded-lg',
        className
      )}
      style={{ width: dimensions.width, height: dimensions.height }}
    >

      {/* 画像表示 */}
      {!imageError ? (
        <Image
          src={file.url}
          alt={file.originalName}
          fill
          className={cn(
            'object-cover transition-opacity',
            rounded ? 'rounded-full' : 'rounded-lg'
          )}
          unoptimized={true}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-200">
          <span className="text-gray-500 text-sm">画像エラー</span>
        </div>
      )}

      {/* オーバーレイ削除ボタン */}
      {deletePosition === 'overlay' && (
        <button
          onClick={handleDelete}
          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors z-10"
          title="削除"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )

  // 外部削除ボタンの場合は追加のコンテナで包む
  if (deletePosition === 'external') {
    return (
      <div className="flex items-start gap-2">
        {previewContent}
        
        <div className="flex flex-col gap-1 min-w-0">
          <button
            onClick={handleDelete}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            title="削除"
          >
            <X className="w-4 h-4" />
          </button>
          
        </div>
      </div>
    )
  }

  return previewContent
}