import type { BaseSectionProps, YouTubeRecommendedData } from '@/types/profile-sections'
import { YouTubeFacade } from '@/components/YouTubeFacade'
import { ThumbsUp } from 'lucide-react'
import { getSectionData, isYouTubeRecommendedData } from '@/lib/sections/type-guards'

const DEFAULT_DATA: YouTubeRecommendedData = { items: [] }

export function YouTubeRecommendedSection({ section, isEditable }: BaseSectionProps) {
  const data = getSectionData('youtube-recommended', section.data, isYouTubeRecommendedData, DEFAULT_DATA)
  const sortedItems = [...data.items].sort((a, b) => a.sortOrder - b.sortOrder)

  if (sortedItems.length === 0) {
    return (
      <div className="w-full aspect-video bg-muted/50 rounded-md flex flex-col items-center justify-center">
        <ThumbsUp className="w-12 h-12 text-muted-foreground/50 mb-2" />
        {isEditable && <p className="text-sm text-muted-foreground">おすすめ動画を追加</p>}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedItems.map((item) => (
        <div key={item.id} className="space-y-2">
          <YouTubeFacade videoId={item.videoId} title={item.title} />
          {item.title && (
            <p className="text-sm font-medium line-clamp-2">{item.title}</p>
          )}
        </div>
      ))}
    </div>
  )
}
