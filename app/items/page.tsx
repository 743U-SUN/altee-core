import Link from "next/link"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Card, CardContent } from "@/components/ui/card"
import { getUserNavData } from "@/lib/user-data"
import { Package, Cpu, Monitor, Headphones, Mouse, Keyboard, Camera, Mic, AppWindow } from "lucide-react"

// カテゴリデータ
const categories = [
    {
        id: "pc-parts",
        name: "PCパーツ",
        description: "CPU、GPU、メモリ、ストレージなど",
        icon: Cpu,
        href: "/items/pc-parts",
        color: "bg-blue-500/10 text-blue-600",
        itemCount: 1250,
    },
    {
        id: "monitors",
        name: "モニター",
        description: "ゲーミングモニター、配信用モニター",
        icon: Monitor,
        href: "/items/monitors",
        color: "bg-purple-500/10 text-purple-600",
        itemCount: 340,
    },
    {
        id: "audio",
        name: "オーディオ",
        description: "ヘッドセット、イヤホン、スピーカー",
        icon: Headphones,
        href: "/items/audio",
        color: "bg-green-500/10 text-green-600",
        itemCount: 520,
    },
    {
        id: "mouse",
        name: "マウス",
        description: "ゲーミングマウス、トラックボール",
        icon: Mouse,
        href: "/items/mouse",
        color: "bg-orange-500/10 text-orange-600",
        itemCount: 280,
    },
    {
        id: "keyboard",
        name: "キーボード",
        description: "メカニカル、静電容量無接点",
        icon: Keyboard,
        href: "/items/keyboard",
        color: "bg-pink-500/10 text-pink-600",
        itemCount: 410,
    },
    {
        id: "camera",
        name: "カメラ・キャプチャ",
        description: "Webカメラ、キャプチャボード",
        icon: Camera,
        href: "/items/camera",
        color: "bg-red-500/10 text-red-600",
        itemCount: 180,
    },
    {
        id: "microphone",
        name: "マイク",
        description: "コンデンサーマイク、ダイナミックマイク",
        icon: Mic,
        href: "/items/microphone",
        color: "bg-cyan-500/10 text-cyan-600",
        itemCount: 220,
    },
    {
        id: "software",
        name: "ソフトウェア",
        description: "配信ソフト、編集ソフト、プラグイン",
        icon: AppWindow,
        href: "/items/software",
        color: "bg-indigo-500/10 text-indigo-600",
        itemCount: 95,
    },
]

export default async function ItemsPage() {
    const user = await getUserNavData()

    return (
        <BaseLayout variant="default" user={user}>
            <div className="flex flex-col gap-6">
                {/* ヘッダー */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">アイテムカタログ</h1>
                        <p className="text-muted-foreground">
                            VTuber・配信者が使用している機材を探す
                        </p>
                    </div>
                </div>

                {/* カテゴリグリッド */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categories.map((category) => {
                        const IconComponent = category.icon
                        return (
                            <Link key={category.id} href={category.href}>
                                <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer p-0 h-full group">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        {/* アイコン */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${category.color}`}>
                                            <IconComponent className="h-6 w-6" />
                                        </div>

                                        {/* カテゴリ情報 */}
                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                                                {category.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                {category.description}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>

                {/* 人気アイテムセクション（プレースホルダー） */}
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">🔥 人気のアイテム</h2>
                    <p className="text-muted-foreground text-center py-12 bg-muted/30 rounded-lg">
                        人気アイテムの表示エリア（coming soon）
                    </p>
                </div>

                {/* 最近追加されたアイテム（プレースホルダー） */}
                <div>
                    <h2 className="text-xl font-bold mb-4">🆕 最近追加されたアイテム</h2>
                    <p className="text-muted-foreground text-center py-12 bg-muted/30 rounded-lg">
                        新着アイテムの表示エリア（coming soon）
                    </p>
                </div>
            </div>
        </BaseLayout>
    )
}
