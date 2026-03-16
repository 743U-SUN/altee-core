'use client'

import useSWR from 'swr'
import type { BaseSectionProps, YouTubeLatestData } from '@/types/profile-sections'
import { YouTubeFacade } from '@/components/YouTubeFacade'
import { fetchPublicYoutubeRss } from '@/app/actions/social/youtube-actions'
import { Rss, Loader2 } from 'lucide-react'
import { getSectionData, isYouTubeLatestData } from '@/lib/sections/type-guards'

const DEFAULT_DATA: YouTubeLatestData = { channelId: '', rssFeedLimit: 6 }

export function YouTubeLatestSection({ section, isEditable }: BaseSectionProps) {
  const data = getSectionData('youtube-latest', section.data, isYouTubeLatestData, DEFAULT_DATA)

  const { data: rssResult, isLoading } = useSWR(
    data.channelId ? ['youtube-rss', data.channelId, data.rssFeedLimit] : null,
    () => fetchPublicYoutubeRss(data.channelId, data.rssFeedLimit),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60 * 60 * 1000, // 1時間（YouTube RSS は更新頻度が低い）
    }
  )

  const videos = rssResult?.success && rssResult.data ? rssResult.data : []

  if (!data.channelId) {
    return (
      <div className="w-full py-12 bg-muted/50 rounded-md flex flex-col items-center justify-center">
        <Rss className="w-12 h-12 text-muted-foreground/50 mb-2" />
        {isEditable && <p className="text-sm text-muted-foreground">チャンネルIDを設定してください</p>}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full py-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">動画を読み込み中...</span>
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="w-full py-12 bg-muted/50 rounded-md flex flex-col items-center justify-center">
        <Rss className="w-12 h-12 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">最新動画がありません</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div key={video.videoId} className="space-y-2">
          <YouTubeFacade videoId={video.videoId} title={video.title} />
          {video.title && (
            <p className="text-sm font-medium line-clamp-2">{video.title}</p>
          )}
        </div>
      ))}
    </div>
  )
}
