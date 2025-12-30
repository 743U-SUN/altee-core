import { notFound } from "next/navigation"
import { getUserByHandle, getCurrentLiveStream, getTopRecommendedVideo } from "@/app/actions/platform-actions"
import { YouTubeEmbed } from "@next/third-parties/google"
import { TwitchEmbed } from "@/components/TwitchEmbed"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  User, Heart, Scale, Calendar, Book, Music, Coffee,
  Briefcase, MapPin, Globe, MessageCircle, Mail
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

// リンクのダミーデータ（アイコンは文字列で保持）
const dummyLinks = [
  { id: "1", iconName: "twitter", label: "Twitter", url: "https://twitter.com/example" },
  { id: "2", iconName: "instagram", label: "Instagram", url: "https://instagram.com/example" },
  { id: "3", iconName: "youtube", label: "YouTube", url: "https://youtube.com/@example" },
  { id: "4", iconName: "github", label: "GitHub", url: "https://github.com/example" },
  { id: "5", iconName: "linkedin", label: "LinkedIn", url: "https://linkedin.com/in/example" },
  { id: "6", iconName: "facebook", label: "Facebook", url: "https://facebook.com/example" },
  { id: "7", iconName: "messageCircle", label: "Discord", url: "https://discord.gg/example" },
  { id: "8", iconName: "mail", label: "Email", url: "mailto:example@example.com" },
]

// アイコンマッピング（SVG使用のため）
const iconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  twitter: (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
    </svg>
  ),
  youtube: (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  github: (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  linkedin: (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  facebook: (props) => (
    <svg {...props} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  messageCircle: MessageCircle,
  mail: Mail,
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
              <YouTubeEmbed
                videoid={displayContent.videoId}
                height={400}
                params="controls=1&autoplay=0"
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
              <Link href={`/${handle}/videos`}>
                もっと見る →
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">@{handle}</h1>
        <p className="text-muted-foreground">
          This is the profile page for user: {handle}
        </p>
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

      <div>
        <h2 className="text-xl font-semibold mb-4">リンク</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {dummyLinks.map((link) => {
            const IconComponent = iconComponents[link.iconName]
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
              >
                <IconComponent className="h-5 w-5 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
                <span className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
                  {link.label}
                </span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}
