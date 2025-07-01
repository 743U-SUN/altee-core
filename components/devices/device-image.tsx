'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DeviceImageProps {
  src: string | null | undefined
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function DeviceImage({ 
  src, 
  alt, 
  width = 300, 
  height = 300, 
  className,
  priority = false 
}: DeviceImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // srcが無効な場合は最初からフォールバック画像を表示
  const shouldUseFallback = !src || hasError

  return (
    <div className={cn("relative overflow-hidden rounded-md", className)}>
      <Image
        src={shouldUseFallback ? '/images/device-placeholder.svg' : src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        unoptimized={!shouldUseFallback} // 外部URLの場合はunoptimized
        className={cn(
          "object-cover transition-opacity duration-300",
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