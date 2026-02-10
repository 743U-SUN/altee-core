import Link from "next/link"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getUserNavData } from "@/lib/user-data"
import { Users } from "lucide-react"

// ダミーデータ（後でデータベースから取得に変更）
const dummyVtubers = [
    {
        id: "1",
        handle: "sakura",
        characterName: "桜花ミコ",
        image: "/avatars/shadcn.jpg",
        headerImage: "/images/demo/header_pink.png",
        bio: "ゲーム配信メインのVTuber",
        platforms: ["YouTube", "Twitch"],
    },
    {
        id: "2",
        handle: "luna",
        characterName: "月乃ルナ",
        image: null,
        headerImage: "/images/demo/header_blue.png",
        bio: "歌ってみた中心に活動中",
        platforms: ["YouTube"],
    },
    {
        id: "3",
        handle: "hikari",
        characterName: "光野ヒカリ",
        image: null,
        headerImage: "/images/demo/header_orange.png",
        bio: "雑談配信が得意です",
        platforms: ["Twitch"],
    },
    {
        id: "4",
        handle: "sora",
        characterName: "空乃ソラ",
        image: null,
        headerImage: "/images/demo/header_pink.png",
        bio: "ASMRやってます",
        platforms: ["YouTube", "Twitch"],
    },
    {
        id: "5",
        handle: "yuki",
        characterName: "雪村ユキ",
        image: null,
        headerImage: "/images/demo/header_blue.png",
        bio: "イラストレーター兼VTuber",
        platforms: ["YouTube"],
    },
    {
        id: "6",
        handle: "kuro",
        characterName: "黒崎クロ",
        image: null,
        headerImage: "/images/demo/header_orange.png",
        bio: "ホラゲー実況専門",
        platforms: ["YouTube", "Twitch"],
    },
]

export default async function VTuberListPage() {
    const user = await getUserNavData()

    return (
        <BaseLayout variant="default" user={user}>
            <div className="flex flex-col gap-6">
                {/* ヘッダー */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">VTuber一覧</h1>
                        <p className="text-muted-foreground">
                            登録されているVTuberを探す
                        </p>
                    </div>
                </div>

                {/* フィルター（TODO: 後で実装） */}
                <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">全て</Badge>
                    <Badge variant="outline">YouTube</Badge>
                    <Badge variant="outline">Twitch</Badge>
                </div>

                {/* VTuber グリッド - Twitter/X風カード */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dummyVtubers.map((vtuber) => (
                        <Link key={vtuber.id} href={`/@${vtuber.handle}`}>
                            <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer p-0 gap-0">
                                {/* ヘッダー画像 - 余白なし */}
                                <div className="h-24 relative overflow-hidden bg-muted">
                                    {vtuber.headerImage ? (
                                        <img
                                            src={vtuber.headerImage}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="w-full h-full"
                                            style={{
                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            }}
                                        />
                                    )}
                                </div>

                                <CardContent className="relative pt-0 pb-4 px-4">
                                    {/* アバター（中心がヘッダーのボトムラインに合う） */}
                                    <div className="absolute -top-8 left-4">
                                        <Avatar className="h-16 w-16 border-4 border-background">
                                            <AvatarImage src={vtuber.image || undefined} />
                                            <AvatarFallback className="text-lg">
                                                {vtuber.characterName?.charAt(0) || "V"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    {/* ユーザー情報 - アバター分のスペースを確保 */}
                                    <div className="pt-10 space-y-1">
                                        <h3 className="font-bold text-lg truncate">
                                            {vtuber.characterName}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            @{vtuber.handle}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                            {vtuber.bio}
                                        </p>

                                        {/* プラットフォームバッジ */}
                                        <div className="flex gap-1 pt-2">
                                            {vtuber.platforms.map((platform) => (
                                                <Badge
                                                    key={platform}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {platform}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* 件数表示 */}
                <p className="text-sm text-muted-foreground text-center">
                    {dummyVtubers.length}件のVTuberが登録されています
                </p>
            </div>
        </BaseLayout>
    )
}
