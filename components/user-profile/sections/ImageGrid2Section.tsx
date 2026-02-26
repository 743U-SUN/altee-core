'use client'

import type { BaseSectionProps } from '@/types/profile-sections'
import { ImageGridCard } from './shared/ImageGridCard'
import { isImageGrid2Data } from '@/lib/sections'
import { IMAGE_SIZES } from '@/lib/image-sizes'

/**
 * 2列グリッド画像セクション
 * 2枚の画像を横並びで表示（4:3アスペクト比）
 */
export function ImageGrid2Section({ section }: BaseSectionProps) {
  const data = isImageGrid2Data(section.data) ? section.data : { items: [] }
  const items = data.items || []

  // sortOrderでソート
  const sortedItems = [...items].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4">
      {sortedItems.map((item, index) => (
        <ImageGridCard
          key={item.id || index}
          item={item}
          aspectRatio="4/3"
          cardSize="md"
          imageSizes={IMAGE_SIZES.grid2}
        />
      ))}
    </div>
  )
}
