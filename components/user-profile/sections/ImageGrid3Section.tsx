'use client'

import type { BaseSectionProps } from '@/types/profile-sections'
import { ImageGridCard } from './shared/ImageGridCard'
import { isImageGrid3Data } from '@/lib/sections'
import { IMAGE_SIZES } from '@/lib/image-sizes'

/**
 * 3列グリッド画像セクション
 * 3枚の画像を横並びで表示（正方形アスペクト比）
 */
export function ImageGrid3Section({ section }: BaseSectionProps) {
  const data = isImageGrid3Data(section.data) ? section.data : { items: [] }
  const items = data.items || []

  // sortOrderでソート
  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
      {sortedItems.map((item, index) => (
        <ImageGridCard
          key={item.id || index}
          item={item}
          aspectRatio="square"
          cardSize="sm"
          imageSizes={IMAGE_SIZES.grid3}
        />
      ))}
    </div>
  )
}
