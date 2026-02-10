import Link from "next/link"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUserNavData } from "@/lib/user-data"
import { Newspaper } from "lucide-react"

// ダミー投稿データ
const dummyPosts = [
    {
        id: "1",
        type: "official",
        author: {
            name: "altee運営",
            handle: "admin",
            image: "/avatars/admin.png",
            fallback: "A"
        },
        title: "alteeリニューアルオープンのお知らせ！新機能のご紹介と今後のロードマップについて",
        thumbnail: "/images/demo/header_blue.png",
        content: "平素よりalteeをご利用いただきありがとうございます。この度、サイトデザインを一新し、より使いやすくなりました。",
        date: "2025/12/25",
        tags: ["お知らせ"],
        likes: 120,
        comments: 15,
    },
    {
        id: "2",
        type: "group",
        author: {
            name: "ホロライブ",
            handle: "hololive",
            image: null,
            fallback: "ホ"
        },
        title: "年末年始の配信スケジュールについて【ホロライブ】",
        thumbnail: "/images/demo/header_pink.png",
        content: "今年の年末年始もホロライブメンバーによるリレー配信を行います！詳細は特設サイトをご覧ください。",
        date: "2025/12/28",
        tags: ["配信情報"],
        likes: 5400,
        comments: 342,
    },
    {
        id: "3",
        type: "user",
        author: {
            name: "桜花ミコ",
            handle: "sakura",
            image: "/avatars/shadcn.jpg",
            fallback: "桜"
        },
        title: "【重大告知】新衣装お披露目配信やります！絶対来てね🌸",
        thumbnail: "/images/demo/header_orange.png",
        content: "来週の土曜日、21時から新衣装のお披露目配信をやります！",
        date: "2026/01/02",
        tags: ["告知"],
        likes: 890,
        comments: 120,
    },
    {
        id: "4",
        type: "user",
        author: {
            name: "雪村ユキ",
            handle: "yuki",
            image: null,
            fallback: "雪"
        },
        title: "FPS上達のためにやっている毎日のルーティン練習方法",
        thumbnail: "/images/demo/header_blue.png",
        content: "最近はずっとFPSをやっています。エイムが良くなってきた気がする...！",
        date: "2026/01/03",
        tags: ["雑談", "ゲーム"],
        likes: 45,
        comments: 8,
    },
    {
        id: "5",
        type: "group",
        author: {
            name: "にじさんじ",
            handle: "nijisanji",
            image: null,
            fallback: "に"
        },
        title: "新グッズ「Winter Voice 2025」発売開始！詳細はこちら",
        thumbnail: "/images/demo/header_pink.png",
        content: "本日より、総勢50名のライバーによる「Winter Voice 2025」の販売を開始しました。",
        date: "2026/01/03",
        tags: ["グッズ"],
        likes: 2100,
        comments: 156,
    },
    {
        id: "6",
        type: "user",
        author: {
            name: "青山カケル",
            handle: "kakeru",
            image: null,
            fallback: "青"
        },
        title: "【歌ってみた】青空のラプソディ / 青山カケル (Cover)",
        thumbnail: "/images/demo/header_orange.png",
        content: "久しぶりの歌ってみた投稿です！元気が出る曲を歌いました。",
        date: "2026/01/04",
        tags: ["歌ってみた"],
        likes: 330,
        comments: 42,
    },
]

export default async function PostsPage() {
    const user = await getUserNavData()

    return (
        <BaseLayout variant="default" user={user}>
            <div className="flex flex-col gap-6">
                {/* ヘッダー */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Newspaper className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">新着投稿</h1>
                        <p className="text-muted-foreground">
                            運営、グループ、VTuberからのお知らせ
                        </p>
                    </div>
                </div>

                {/* フィルター（タブ風） */}
                <div className="flex gap-2 pb-2 overflow-x-auto">
                    <Button variant="secondary" size="sm" className="rounded-full">全て</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">公式お知らせ</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">グループ</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">VTuber</Button>
                </div>

                {/* 投稿リスト (YouTube風グリッド) */}
                <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                    {dummyPosts.map((post) => (
                        <Link key={post.id} href={`/posts/${post.id}`}>
                            <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer p-0 gap-0 group">
                                {/* サムネイル画像 */}
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    {post.thumbnail ? (
                                        <img
                                            src={post.thumbnail}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                                    )}
                                    {/* 公式バッジ（サムネイル上に配置） */}
                                    {post.type === 'official' && (
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="default" className="text-[10px] h-5 shadow-sm">公式</Badge>
                                        </div>
                                    )}
                                </div>

                                {/* コンテンツエリア */}
                                <div className="flex flex-col gap-2 p-4">
                                    {/* タイトル */}
                                    <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                        {post.title}
                                    </h3>

                                    {/* メタデータ: [アイコン] [ユーザー名] */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarImage src={post.author.image || undefined} />
                                            <AvatarFallback className="text-xs">{post.author.fallback}</AvatarFallback>
                                        </Avatar>
                                        <span>{post.author.name}</span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </BaseLayout>
    )
}
