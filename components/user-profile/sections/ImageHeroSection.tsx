'use client'

import Image from 'next/image'
import { ExternalLink, ImageIcon } from 'lucide-react'
import type { BaseSectionProps } from '@/types/profile-sections'
import { isImageHeroData } from '@/lib/sections'
import { useUserTheme } from '@/components/theme-provider/useUserTheme'
import { cn } from '@/lib/utils'
import { HOVER_CLASSES } from '@/lib/sections/constants'
import { IMAGE_SIZES } from '@/lib/image-sizes'

/**
 * ヒーロー画像セクション
 * 大きなバナー画像（21:9アスペクト比）を表示
 * hover効果はテーマ連動
 */
export function ImageHeroSection({ section }: BaseSectionProps) {
  const { getDecoration } = useUserTheme()
  const hoverEffect = getDecoration('cardHover')
  const data = isImageHeroData(section.data) ? section.data : { item: undefined }
  const item = data.item

  // 画像が未設定の場合
  if (!item?.imageKey) {
    return (
      <div className="relative w-full aspect-[21/9] overflow-hidden bg-muted/50">
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">画像が設定されていません</p>
        </div>
      </div>
    )
  }

  const imageUrl = `/api/files/${item.imageKey}`

  const Content = (
    <div className={cn(
      "relative w-full aspect-[21/9] overflow-hidden group shadow-lg",
      HOVER_CLASSES[hoverEffect] ?? ''
    )}>
      <Image
        src={imageUrl}
        alt={item.title || 'ヒーロー画像'}
        fill
        sizes={IMAGE_SIZES.large}
        priority
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Content Layer */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
        {(item.title || item.subtitle) && (
          <div className="space-y-1">
            {item.subtitle && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold tracking-wider uppercase mb-1">
                {item.subtitle}
              </span>
            )}
            {item.title && (
              <h3 className="text-2xl font-bold tracking-tight drop-shadow-md">
                {item.title}
              </h3>
            )}
          </div>
        )}

        {item.overlayText && (
          <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/20">
            {item.overlayText}
          </div>
        )}

        {item.linkUrl && (
          <div className="absolute top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  )

  if (item.linkUrl) {
    return (
      <a
        href={item.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={item.title ? `${item.title}へのリンク` : '外部リンク'}
        className="block w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {Content}
      </a>
    )
  }

  return Content
}
