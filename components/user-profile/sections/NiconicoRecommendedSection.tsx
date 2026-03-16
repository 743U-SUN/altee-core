import type { BaseSectionProps, NiconicoRecommendedData } from '@/types/profile-sections'
import { NiconicoFacade } from '@/components/NiconicoFacade'
import { Tv2 } from 'lucide-react'
import { getSectionData, isNiconicoRecommendedData } from '@/lib/sections/type-guards'

const DEFAULT_DATA: NiconicoRecommendedData = { items: [] }

export function NiconicoRecommendedSection({ section, isEditable }: BaseSectionProps) {
  const data = getSectionData('niconico-recommended', section.data, isNiconicoRecommendedData, DEFAULT_DATA)
  const sortedItems = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder)

  if (sortedItems.length === 0) {
    return (
      <div className="w-full aspect-video bg-muted/50 rounded-md flex flex-col items-center justify-center">
        <Tv2 className="w-12 h-12 text-muted-foreground/50 mb-2" />
        {isEditable && <p className="text-sm text-muted-foreground">ニコニコおすすめ動画を追加</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedItems.map((item) => (
        <div key={item.id} className="space-y-2">
          <NiconicoFacade videoId={item.videoId} title={item.title} thumbnailUrl={item.thumbnail} />
          {item.title && (
            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
          )}
        </div>
      ))}
    </div>
  )
}
