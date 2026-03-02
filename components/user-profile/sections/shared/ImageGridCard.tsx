'use client'

import Image from 'next/image'
import { ExternalLink, ImageIcon } from 'lucide-react'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import type { ImageGridItem } from '@/types/profile-sections'
import { useUserTheme } from '@/components/theme-provider/useUserTheme'
import { cn } from '@/lib/utils'
import { HOVER_CLASSES } from '@/lib/sections/constants'

interface ImageGridCardProps {
  item: ImageGridItem
  aspectRatio: 'square' | '4/3'
  cardSize: 'sm' | 'md'
  imageSizes?: string
}

/**
 * 画像グリッドの共通カードコンポーネント
 * ImageGrid2Section, ImageGrid3Sectionで使用
 * hover効果はテーマ連動
 */
export function ImageGridCard({ item, aspectRatio, cardSize, imageSizes }: ImageGridCardProps) {
  const { getDecoration } = useUserTheme()
  const hoverEffect = getDecoration('cardHover')

  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : 'aspect-[4/3]'
  const roundedClass = cardSize === 'sm' ? 'rounded-2xl' : 'rounded-3xl'
  const shadowClass = cardSize === 'sm' ? 'shadow-md' : 'shadow-lg'
  const paddingClass = cardSize === 'sm' ? 'p-4' : 'p-5'
  const titleSize = cardSize === 'sm' ? 'text-lg' : 'text-xl'
  const badgeSize = cardSize === 'sm' ? 'text-[9px]' : 'text-[10px]'
  const overlayPadding = cardSize === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'
  const overlayPosition = cardSize === 'sm' ? 'top-2 right-2' : 'top-3 right-3'
  const iconSize = cardSize === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const iconPadding = cardSize === 'sm' ? 'p-1.5' : 'p-1.5'
  const placeholderIconSize = cardSize === 'sm' ? 'w-8 h-8' : 'w-10 h-10'
  const placeholderTextSize = cardSize === 'sm' ? 'text-xs' : 'text-sm'

  // 画像の sizes 属性（propsで渡された値を優先、フォールバックはaspectRatioベースの簡易値）
  const resolvedImageSizes = imageSizes ?? (
    aspectRatio === 'square'
      ? '(max-width: 640px) 33vw, 200px'
      : '(max-width: 640px) 50vw, 300px'
  )

  // 画像が未設定の場合
  if (!item?.imageKey) {
    return (
      <div className={`relative w-full ${aspectClass} ${roundedClass} overflow-hidden bg-muted/50`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ImageIcon className={`${placeholderIconSize} text-muted-foreground/50 mb-1`} />
          <p className={`${placeholderTextSize} text-muted-foreground`}>画像未設定</p>
        </div>
      </div>
    )
  }

  const imageUrl = getPublicUrl(item.imageKey)

  const Content = (
    <div className={cn(
      `relative w-full ${aspectClass} ${roundedClass} overflow-hidden group ${shadowClass}`,
      HOVER_CLASSES[hoverEffect] ?? ''
    )}>
      <Image
        src={imageUrl}
        alt={item.title || '画像'}
        fill
        sizes={resolvedImageSizes}
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Content Layer */}
      <div className={`absolute inset-0 ${paddingClass} flex flex-col justify-end text-white`}>
        {(item.title || item.subtitle) && (
          <div className={cardSize === 'sm' ? 'space-y-0.5' : 'space-y-1'}>
            {item.subtitle && (
              <span className={`inline-block px-${cardSize === 'sm' ? '1.5' : '2'} py-0.5 rounded-full bg-white/20 backdrop-blur-sm ${badgeSize} font-bold tracking-wider uppercase mb-${cardSize === 'sm' ? '0.5' : '1'}`}>
                {item.subtitle}
              </span>
            )}
            {item.title && (
              <h3 className={`${titleSize} font-bold tracking-tight drop-shadow-md ${cardSize === 'sm' ? 'leading-tight' : ''}`}>
                {item.title}
              </h3>
            )}
          </div>
        )}

        {item.overlayText && (
          <div className={`absolute ${overlayPosition} bg-black/30 backdrop-blur-md ${overlayPadding} rounded-full ${badgeSize} font-bold border border-white/20`}>
            {item.overlayText}
          </div>
        )}

        {item.linkUrl && (
          <div className={`absolute ${overlayPosition} ${iconPadding} rounded-full bg-white/10 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity`}>
            <ExternalLink className={`${iconSize} text-white`} />
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
        className={`block w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${roundedClass}`}
      >
        {Content}
      </a>
    )
  }

  return Content
}
