'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { cn } from '@/lib/utils'

interface ItemImageProps {
  imageStorageKey?: string | null
  customImageUrl?: string | null
  amazonImageUrl?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function ItemImage({
  imageStorageKey,
  customImageUrl,
  amazonImageUrl,
  alt,
  width = 300,
  height = 300,
  className,
  priority = false
}: ItemImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // R2優先、フォールバックでカスタムURL、次にAmazon画像、最後にプレースホルダー
  const getImageSrc = () => {
    if (hasError) return '/images/item-placeholder.svg'
    if (imageStorageKey) {
      return getPublicUrl(imageStorageKey)
    }
    if (customImageUrl) {
      return customImageUrl
    }
    if (amazonImageUrl) {
      return amazonImageUrl
    }
    return '/images/item-placeholder.svg'
  }

  const src = getImageSrc()
  const isExternalUrl = src.startsWith('http')

  return (
    <div className={cn("relative overflow-hidden rounded-md", className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        unoptimized={isExternalUrl} // 外部URLの場合はunoptimized
        className={cn(
          "object-cover transition-opacity duration-300 w-full h-full",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
        onLoad={() => {
          setIsLoading(false)
        }}
      />

      {/* ローディング状態の表示 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="flex flex-col items-center space-y-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="text-xs text-muted-foreground">画像を読み込み中...</span>
          </div>
        </div>
      )}
    </div>
  )
}
