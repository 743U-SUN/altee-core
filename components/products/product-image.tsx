'use client'

import Image from 'next/image'
import React, { useState, memo } from 'react'
import { cn } from '@/lib/utils'

interface ProductImageProps {
  imageStorageKey?: string | null
  customImageUrl?: string | null
  amazonImageUrl?: string | null
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

const ProductImageComponent = ({
  imageStorageKey,
  customImageUrl,
  amazonImageUrl,
  alt,
  width = 300,
  height = 300,
  className,
  priority = false
}: ProductImageProps) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // R2優先、フォールバックでカスタムURL、次にAmazon画像、最後にプレースホルダー
  const getImageSrc = () => {
    if (hasError) return '/images/product-placeholder.svg'
    if (imageStorageKey) {
      return `/api/files/${imageStorageKey}`
    }
    if (customImageUrl) {
      return customImageUrl
    }
    if (amazonImageUrl) {
      return amazonImageUrl
    }
    return '/images/product-placeholder.svg'
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
        onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
          console.error('[ProductImage] Image load error:', src, e)
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

// propsの比較関数 - 画像URLが同じなら再レンダリングをスキップ
const arePropsEqual = (prevProps: ProductImageProps, nextProps: ProductImageProps) => {
  return (
    prevProps.imageStorageKey === nextProps.imageStorageKey &&
    prevProps.customImageUrl === nextProps.customImageUrl &&
    prevProps.amazonImageUrl === nextProps.amazonImageUrl &&
    prevProps.alt === nextProps.alt &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.className === nextProps.className &&
    prevProps.priority === nextProps.priority
  )
}

// メモ化されたコンポーネントをエクスポート
export const ProductImage = memo(ProductImageComponent, arePropsEqual)
