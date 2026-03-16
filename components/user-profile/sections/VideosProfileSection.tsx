import type { BaseSectionProps, VideosProfileData } from '@/types/profile-sections'
import { Film } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { getSectionData, isVideosProfileData } from '@/lib/sections/type-guards'

const DEFAULT_DATA: VideosProfileData = { title: '' }

export function VideosProfileSection({ section }: BaseSectionProps) {
  const data = getSectionData('videos-profile', section.data, isVideosProfileData, DEFAULT_DATA)

  return (
    <ThemedCard size="md">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Film className="w-3 h-3" />
            動画
          </Badge>
        </div>
        {data.title && (
          <h2 className="text-2xl font-bold">{data.title}</h2>
        )}
        {data.description && (
          <p className="text-muted-foreground whitespace-pre-wrap">{data.description}</p>
        )}
      </div>
    </ThemedCard>
  )
}
