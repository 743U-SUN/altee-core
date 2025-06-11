'use client'

import { useCallback, useState } from 'react'
import { Upload, FileImage } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PreviewSize, CustomSize } from '@/types/image-upload'

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  disabled?: boolean
  className?: string
  accept?: string[]
  previewSize?: PreviewSize | CustomSize
  rounded?: boolean
}

export function DropZone({
  onFilesSelected,
  maxFiles = 10,
  disabled = false,
  className,
  accept = ['image/*'],
  previewSize = 'medium',
  rounded = false
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    const limitedFiles = maxFiles ? files.slice(0, maxFiles) : files
    
    if (limitedFiles.length > 0) {
      onFilesSelected(limitedFiles)
    }
  }, [disabled, maxFiles, onFilesSelected])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const limitedFiles = maxFiles ? files.slice(0, maxFiles) : files
    
    if (limitedFiles.length > 0) {
      onFilesSelected(limitedFiles)
    }
    
    // ファイル選択をリセット（同じファイルを再選択可能にする）
    e.target.value = ''
  }, [maxFiles, onFilesSelected])

  // プレビューサイズからドロップゾーンのサイズを計算
  const getDimensions = () => {
    if (typeof previewSize === 'object') {
      return { width: previewSize.width, height: previewSize.height }
    }
    
    const sizeMap: Record<PreviewSize, { width: number; height: number }> = {
      small: { width: 64, height: 64 },
      medium: { width: 160, height: 160 },
      large: { width: 320, height: 240 },
      custom: { width: 160, height: 160 } // デフォルト値
    }
    
    return sizeMap[previewSize]
  }

  const dimensions = getDimensions()
  const isSmall = dimensions.width <= 80
  const isMedium = dimensions.width <= 160

  return (
    <div
      className={cn(
        'relative border-2 border-dashed transition-colors flex items-center justify-center',
        rounded ? 'rounded-full' : 'rounded-lg',
        isDragOver && !disabled
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:border-gray-400 hover:bg-gray-100 cursor-pointer',
        className
      )}
      style={{ width: dimensions.width, height: dimensions.height }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept.join(',')}
        multiple={maxFiles !== 1}
        onChange={handleFileSelect}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
      />
      
      {isSmall ? (
        // 小さいサイズ（64x64以下）：アイコンのみ
        <div className={cn(
          'rounded-full p-2',
          isDragOver && !disabled
            ? 'bg-blue-100 text-blue-600'
            : 'bg-gray-200 text-gray-500'
        )}>
          {isDragOver ? (
            <FileImage className="w-4 h-4" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
        </div>
      ) : isMedium ? (
        // 中サイズ（160x160以下）：アイコン + 簡潔なテキスト
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'p-2 rounded-full',
            isDragOver && !disabled
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-200 text-gray-500'
          )}>
            {isDragOver ? (
              <FileImage className="w-6 h-6" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          
          <div className="text-center">
            <p className="text-xs font-medium text-gray-700">
              {isDragOver ? 'ドロップ' : 'ファイル選択'}
            </p>
          </div>
        </div>
      ) : (
        // 大サイズ（320x240以上）：フルコンテンツ
        <div className="flex flex-col items-center gap-4 p-4">
          <div className={cn(
            'p-4 rounded-full',
            isDragOver && !disabled
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-200 text-gray-500'
          )}>
            {isDragOver ? (
              <FileImage className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>
          
          <div className="space-y-2 text-center">
            <p className="font-medium text-gray-700">
              {isDragOver
                ? 'ファイルをドロップしてください'
                : 'ファイルをドラッグ&ドロップまたはクリックして選択'
              }
            </p>
            
            <p className="text-sm text-gray-500">
              対応形式: JPG, PNG, GIF, WebP, SVG
              {maxFiles > 1 && (
                <span className="block">最大{maxFiles}ファイルまで</span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}