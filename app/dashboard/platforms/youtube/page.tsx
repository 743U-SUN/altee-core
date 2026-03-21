import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getDashboardYoutubeSettings } from '@/lib/queries/youtube-queries'
import { getMyRssFeedVideos } from "@/app/actions/social/youtube-actions"
import { YouTubeTabContent } from "../components/YouTubeTabContent"

export const metadata: Metadata = {
  title: 'YouTube設定',
  description: 'YouTubeチャンネル設定とおすすめ動画管理',
}

export default async function YouTubePlatformPage() {
  const session = await requireAuth()

  // YouTube設定とRSS Feedを並列で取得
  const [youtubeResult, rssFeedResult] = await Promise.all([
    getDashboardYoutubeSettings(session.user.id),
    getMyRssFeedVideos()
  ])

  return (
    <div className="space-y-6">
      <YouTubeTabContent
        initialData={youtubeResult.success && youtubeResult.data ? youtubeResult.data : null}
        initialRssFeedVideos={rssFeedResult.success && rssFeedResult.data ? rssFeedResult.data : []}
      />
    </div>
  )
}
