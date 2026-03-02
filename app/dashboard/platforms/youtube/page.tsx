import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { getUserYoutubeSettings, getMyRssFeedVideos } from "@/app/actions/social/youtube-actions"
import { YouTubeTabContent } from "../components/YouTubeTabContent"

export default async function YouTubePlatformPage() {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  // YouTube設定とRSS Feedを並列で取得
  const [youtubeResult, rssFeedResult] = await Promise.all([
    getUserYoutubeSettings(),
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
