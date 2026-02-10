import Link from "next/link"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getUserNavData } from "@/lib/user-data"
import { Users, UserPlus } from "lucide-react"

// ダミーデータ（後でデータベースから取得に変更）
const dummyGroups = [
    {
        id: "1",
        handle: "hololive",
        name: "ホロライブ",
        memberCount: 35,
        image: null,
        headerImage: "/images/demo/header_pink.png",
        description: "「ホロライブプロダクション」傘下の女性VTuberグループ。",
        isRecruiting: true,
    },
    {
        id: "2",
        handle: "nijisanji",
        name: "にじさんじ",
        memberCount: 100,
        image: null,
        headerImage: "/images/demo/header_blue.png",
        description: "多種多様なインフルエンサーが所属するVTuber/バーチャルライバープロジェクト。",
        isRecruiting: true,
    },
    {
        id: "3",
        handle: "vspo",
        name: "ぶいすぽっ！",
        memberCount: 18,
        image: null,
        headerImage: "/images/demo/header_orange.png",
        description: "ゲームに本気で取り組むメンバーが集まるeSports VTuberグループ。",
        isRecruiting: false,
    },
    {
        id: "4",
        handle: "noripro",
        name: "のりプロ",
        memberCount: 10,
        image: null,
        headerImage: "/images/demo/header_pink.png",
        description: "漫画家佃煮のりおがプロデュースするVTuber事務所。",
        isRecruiting: true,
    },
    {
        id: "5",
        handle: "aogiri",
        name: "あおぎり高校",
        memberCount: 8,
        image: null,
        headerImage: "/images/demo/header_blue.png",
        description: "「面白ければ何でもあり」をモットーに活動するVTuberグループ。",
        isRecruiting: false,
    },
    {
        id: "6",
        handle: "neoporte",
        name: "Neo-Porte",
        memberCount: 12,
        image: null,
        headerImage: "/images/demo/header_orange.png",
        description: "渋谷ハル、まふまふ、そらる、Crazy Raccoonが運営するVTuber事務所。",
        isRecruiting: true,
    },
]

export default async function GroupListPage() {
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
                        <h1 className="text-2xl font-bold">グループ一覧</h1>
                        <p className="text-muted-foreground">
                            活動中のVTuberグループを探す
                        </p>
                    </div>
                </div>

                {/* フィルター（プレースホルダー） */}
                <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">全て</Badge>
                    <Badge variant="outline">メンバー募集中</Badge>
                    <Badge variant="outline">新着順</Badge>
                    <Badge variant="outline">メンバー数順</Badge>
                </div>

                {/* グループ グリッド - Twitter/X風カード */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dummyGroups.map((group) => (
                        <Link key={group.id} href={`/@${group.handle}`}>
                            <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer p-0 gap-0">
                                {/* ヘッダー画像 */}
                                <div className="h-24 relative overflow-hidden bg-muted">
                                    {group.headerImage ? (
                                        <img
                                            src={group.headerImage}
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
                                    {/* アバター（グループアイコン・正方形かつ丸み） */}
                                    <div className="absolute -top-8 left-4">
                                        <Avatar className="h-16 w-16 border-4 border-background rounded-xl">
                                            <AvatarImage src={group.image || undefined} className="rounded-lg" />
                                            <AvatarFallback className="text-lg rounded-lg">
                                                {group.name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    {/* グループ情報 */}
                                    <div className="pt-10 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg truncate pr-2">
                                                    {group.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    @{group.handle}
                                                </p>
                                            </div>
                                            {/* メンバー募集中バッジ */}
                                            {group.isRecruiting && (
                                                <Badge variant="default" className="text-[10px] px-1.5 h-5 flex items-center gap-1 bg-green-600 hover:bg-green-700">
                                                    <UserPlus className="h-3 w-3" />
                                                    募集中
                                                </Badge>
                                            )}
                                        </div>

                                        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mt-2">
                                            {group.description}
                                        </p>

                                        {/* メンバー数など */}
                                        <div className="flex gap-4 pt-2 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                <span>{group.memberCount}名所属</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* 件数表示 */}
                <p className="text-sm text-muted-foreground text-center">
                    {dummyGroups.length}件のグループが登録されています
                </p>
            </div>
        </BaseLayout>
    )
}
