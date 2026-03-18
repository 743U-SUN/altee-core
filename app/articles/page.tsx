import Link from "next/link"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUserNavData } from "@/lib/user-data"
import { BookOpen } from "lucide-react"

// ダミー記事データ
const dummyArticles = [
    {
        id: "1",
        author: {
            name: "altee運営",
            handle: "admin",
            image: "/avatars/admin.png",
            fallback: "A"
        },
        title: "【初心者向け】VTuberになるために必要な機材と費用をまとめました",
        thumbnail: "/images/demo/header_blue.png",
        excerpt: "VTuberデビューを考えている方向けに、必要な機材と予算を詳しく解説します。",
        category: "入門ガイド",
        readTime: "8分",
        date: "2025/12/20",
    },
    {
        id: "2",
        author: {
            name: "桜花ミコ",
            handle: "sakura",
            image: "/avatars/shadcn.jpg",
            fallback: "桜"
        },
        title: "私が使っているPCスペックと周辺機器を全部公開！配信環境紹介",
        thumbnail: "/images/demo/header_pink.png",
        excerpt: "配信で使っているPC、マイク、カメラなどを詳しく紹介します。",
        category: "機材紹介",
        readTime: "5分",
        date: "2025/12/25",
    },
    {
        id: "3",
        author: {
            name: "月見ルナ",
            handle: "luna",
            image: null,
            fallback: "月"
        },
        title: "歌ってみた動画の作り方完全ガイド：録音からMIXまで",
        thumbnail: "/images/demo/header_orange.png",
        excerpt: "歌ってみた動画を作成する全工程を、初心者にもわかりやすく解説。",
        category: "ハウツー",
        readTime: "12分",
        date: "2025/12/28",
    },
    {
        id: "4",
        author: {
            name: "雪村ユキ",
            handle: "yuki",
            image: null,
            fallback: "雪"
        },
        title: "FPSゲームでエイムを上達させる5つのコツ【プロも実践】",
        thumbnail: "/images/demo/header_blue.png",
        excerpt: "エイム練習法やマウス設定など、すぐに実践できるテクニックを紹介。",
        category: "ゲーム攻略",
        readTime: "6分",
        date: "2026/01/02",
    },
    {
        id: "5",
        author: {
            name: "空乃ソラ",
            handle: "sora",
            image: null,
            fallback: "空"
        },
        title: "ファンとの交流を深めるためのコミュニティ運営術",
        thumbnail: "/images/demo/header_pink.png",
        excerpt: "Discord運営やメンバーシップ活用のコツをお伝えします。",
        category: "運営ノウハウ",
        readTime: "7分",
        date: "2026/01/03",
    },
    {
        id: "6",
        author: {
            name: "altee運営",
            handle: "admin",
            image: "/avatars/admin.png",
            fallback: "A"
        },
        title: "2025年VTuber業界振り返り：注目の出来事とトレンド総まとめ",
        thumbnail: "/images/demo/header_orange.png",
        excerpt: "2025年のVTuber業界で起こった大きな出来事を振り返ります。",
        category: "業界ニュース",
        readTime: "10分",
        date: "2026/01/04",
    },
]

export default async function ArticlesPage() {
    const user = await getUserNavData()

    return (
        <BaseLayout variant="default" user={user}>
            <div className="flex flex-col gap-6">
                {/* ヘッダー */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">記事一覧</h1>
                        <p className="text-muted-foreground">
                            VTuber・配信に関する情報記事
                        </p>
                    </div>
                </div>

                {/* フィルター（タブ風） */}
                <div className="flex gap-2 pb-2 overflow-x-auto">
                    <Button variant="secondary" size="sm" className="rounded-full">全て</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">入門ガイド</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">機材紹介</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">ハウツー</Button>
                    <Button variant="ghost" size="sm" className="rounded-full">業界ニュース</Button>
                </div>

                {/* 記事リスト (YouTube風グリッド) */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dummyArticles.map((article) => (
                        <Link key={article.id} href={`/articles/${article.id}`}>
                            <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer p-0 gap-0 group">
                                {/* サムネイル画像 */}
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                    {article.thumbnail ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={article.thumbnail}
                                            alt={article.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                                    )}
                                    {/* カテゴリバッジ */}
                                    <div className="absolute top-2 left-2">
                                        <Badge variant="secondary" className="text-[10px] h-5 shadow-sm bg-background/80 backdrop-blur-sm">
                                            {article.category}
                                        </Badge>
                                    </div>
                                </div>

                                {/* コンテンツエリア */}
                                <div className="flex flex-col gap-2 p-4">
                                    {/* タイトル */}
                                    <h3 className="font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                        {article.title}
                                    </h3>

                                    {/* メタデータ: [アイコン] [著者名] */}
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Avatar className="h-8 w-8 shrink-0">
                                            <AvatarImage src={article.author.image || undefined} />
                                            <AvatarFallback className="text-xs">{article.author.fallback}</AvatarFallback>
                                        </Avatar>
                                        <span>{article.author.name}</span>
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
