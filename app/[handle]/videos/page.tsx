import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { fetchYoutubeRssFeed } from "@/app/actions/platform-actions"

interface VideosPageProps {
  params: Promise<{
    handle: string
  }>
}

export default async function VideosPage({ params }: VideosPageProps) {
  const { handle } = await params

  // ユーザー情報を取得
  const user = await prisma.user.findUnique({
    where: { handle },
    select: {
      id: true,
      characterName: true,
      youtubeChannelId: true,
      youtubeRssFeedLimit: true,
      youtubeRecommendedVideos: {
        where: { isVisible: true },
        orderBy: { sortOrder: "asc" },
        select: {
          videoId: true,
          title: true,
          thumbnail: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  // RSS Feed動画を取得
  let rssFeedVideos: Array<{ videoId: string; title: string; thumbnail?: string }> = []
  if (user.youtubeChannelId && user.youtubeRssFeedLimit > 0) {
    const rssResult = await fetchYoutubeRssFeed(user.youtubeChannelId, user.youtubeRssFeedLimit)
    if (rssResult.success && rssResult.data) {
      rssFeedVideos = rssResult.data
    }
  }

  const hasRecommendedVideos = user.youtubeRecommendedVideos.length > 0
  const hasRssFeedVideos = rssFeedVideos.length > 0

  if (!hasRecommendedVideos && !hasRssFeedVideos) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">動画</h1>
            <Link
              href={`/${handle}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              プロフィールに戻る
            </Link>
          </div>

          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>まだ動画が設定されていません</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{user.characterName || handle} の動画</h1>
          <Link
            href={`/${handle}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            プロフィールに戻る
          </Link>
        </div>

        {/* おすすめ動画セクション */}
        {hasRecommendedVideos && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">おすすめ動画</h2>
            <div
              className={
                user.youtubeRecommendedVideos.length === 1
                  ? "grid grid-cols-1 gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 gap-6"
              }
            >
              {user.youtubeRecommendedVideos.map((video) => (
                <Link
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title || video.videoId}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title || video.videoId}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 最新動画セクション (RSS Feed) */}
        {hasRssFeedVideos && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">最新動画</h2>
            <div
              className={
                rssFeedVideos.length === 1
                  ? "grid grid-cols-1 gap-6"
                  : "grid grid-cols-1 md:grid-cols-2 gap-6"
              }
            >
              {rssFeedVideos.map((video) => (
                <Link
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnail && (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
