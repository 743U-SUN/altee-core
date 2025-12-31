import { notFound } from "next/navigation"
import { getUserByHandle } from "@/lib/handle-utils"
import { getCurrentLiveStream, getTopRecommendedVideo } from "@/app/actions/platform-actions"
import { YouTubeFacade } from "@/components/YouTubeFacade"
import { TwitchEmbed } from "@/components/TwitchEmbed"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import {
  User, Heart, Scale, Calendar, Book, Music, Coffee,
  Briefcase, MapPin, Globe
} from "lucide-react"

// ユーザーデータのダミー
const dummyUserData = [
  { id: "1", icon: User, field: "名前", value: "山田 太郎" },
  { id: "2", icon: Calendar, field: "誕生日", value: "1995年4月15日" },
  { id: "3", icon: Scale, field: "身長", value: "175cm" },
  { id: "4", icon: Heart, field: "好きなこと", value: "音楽鑑賞" },
  { id: "5", icon: Book, field: "趣味", value: "読書・プログラミング" },
  { id: "6", icon: Music, field: "好きなアーティスト", value: "Official髭男dism" },
  { id: "7", icon: Coffee, field: "好きな飲み物", value: "コーヒー" },
  { id: "8", icon: Briefcase, field: "職業", value: "Webエンジニア" },
  { id: "9", icon: MapPin, field: "出身地", value: "東京都" },
  { id: "10", icon: Globe, field: "言語", value: "日本語・English" },
]

// リンクアイコン表示用のヘルパーコンポーネント
function LinkIcon({ link, className }: {
  link: NonNullable<Awaited<ReturnType<typeof getUserByHandle>>>['userLinks'][0]
  className?: string
}) {
  // カスタムアイコンがある場合
  if (link.customIcon?.storageKey) {
    return (
      <Image
        src={`/api/files/${link.customIcon.storageKey}`}
        alt={link.customLabel || link.linkType.displayName}
        width={20}
        height={20}
        className={className}
      />
    )
  }

  // 選択されたLinkTypeIconがある場合
  if (link.selectedLinkTypeIcon?.iconKey) {
    return (
      <Image
        src={`/api/files/${link.selectedLinkTypeIcon.iconKey}`}
        alt={link.customLabel || link.linkType.displayName}
        width={20}
        height={20}
        className={className}
      />
    )
  }

  // デフォルト: グローブアイコン
  return <Globe className={className} />
}

export default async function HandlePage({
  params
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const user = await getUserByHandle(handle)

  if (!user) {
    notFound()
  }

  // ライブ配信とおすすめ動画を取得
  const [currentLiveStream, topRecommendedVideo] = await Promise.all([
    getCurrentLiveStream(user.id),
    getTopRecommendedVideo(user.id)
  ])

  // 表示するコンテンツを決定（ライブ優先、なければおすすめ動画）
  const displayContent = currentLiveStream || topRecommendedVideo

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-6">
      {/* ライブ配信 or おすすめ動画 */}
      {displayContent && (
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden relative">
            {displayContent.isLive && (
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-red-600 text-white hover:bg-red-700">
                  🔴 LIVE
                </Badge>
              </div>
            )}

            {displayContent.platform === "youtube" ? (
              <YouTubeFacade
                videoId={displayContent.videoId}
              />
            ) : displayContent.platform === "twitch" ? (
              <TwitchEmbed
                channel={displayContent.twitchUsername}
                height={400}
                parent={process.env.NEXT_PUBLIC_DOMAIN}
              />
            ) : null}
          </div>

          {/* 動画一覧へのリンク */}
          <div className="flex justify-end">
            <Button asChild variant="outline" size="sm">
              <Link href={`/@${handle}/videos`}>
                もっと見る →
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">
          {user.characterName || `@${handle}`}
        </h1>
        {user.profile?.bio && (
          <p className="text-muted-foreground whitespace-pre-wrap">
            {user.profile.bio}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">プロフィール</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dummyUserData.map((data) => {
            const IconComponent = data.icon
            return (
              <div
                key={data.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <IconComponent className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-muted-foreground truncate">
                    {data.field}
                  </span>
                  <span className="text-sm font-semibold text-right">
                    {data.value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {user.userLinks && user.userLinks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">リンク</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {user.userLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <LinkIcon
                  link={link}
                  className="h-5 w-5 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors"
                />
                <span className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                  {link.customLabel || link.linkType.displayName}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
