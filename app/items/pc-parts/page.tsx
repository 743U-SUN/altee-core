import Link from "next/link"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUserNavData } from "@/lib/user-data"
import { Cpu, ChevronLeft } from "lucide-react"

// ダミーPCパーツデータ
const dummyPcParts = [
    {
        id: "1",
        name: "AMD Ryzen 9 7950X",
        brand: "AMD",
        category: "CPU",
        thumbnail: "/images/demo/header_orange.png",
        price: "¥89,800",
        usedBy: [
            { name: "桜花ミコ", image: "/avatars/shadcn.jpg", fallback: "桜" },
            { name: "月見ルナ", image: null, fallback: "月" },
        ],
    },
    {
        id: "2",
        name: "Intel Core i9-14900K",
        brand: "Intel",
        category: "CPU",
        thumbnail: "/images/demo/header_blue.png",
        price: "¥92,800",
        usedBy: [
            { name: "雪村ユキ", image: null, fallback: "雪" },
        ],
    },
    {
        id: "3",
        name: "NVIDIA GeForce RTX 4090",
        brand: "NVIDIA",
        category: "GPU",
        thumbnail: "/images/demo/header_pink.png",
        price: "¥298,000",
        usedBy: [
            { name: "桜花ミコ", image: "/avatars/shadcn.jpg", fallback: "桜" },
            { name: "空乃ソラ", image: null, fallback: "空" },
            { name: "雪村ユキ", image: null, fallback: "雪" },
        ],
    },
    {
        id: "4",
        name: "AMD Radeon RX 7900 XTX",
        brand: "AMD",
        category: "GPU",
        thumbnail: "/images/demo/header_orange.png",
        price: "¥168,000",
        usedBy: [
            { name: "月見ルナ", image: null, fallback: "月" },
        ],
    },
    {
        id: "5",
        name: "G.Skill Trident Z5 RGB DDR5-6000 32GB",
        brand: "G.Skill",
        category: "メモリ",
        thumbnail: "/images/demo/header_blue.png",
        price: "¥24,800",
        usedBy: [
            { name: "桜花ミコ", image: "/avatars/shadcn.jpg", fallback: "桜" },
            { name: "雪村ユキ", image: null, fallback: "雪" },
        ],
    },
    {
        id: "6",
        name: "Samsung 990 PRO 2TB NVMe SSD",
        brand: "Samsung",
        category: "ストレージ",
        thumbnail: "/images/demo/header_pink.png",
        price: "¥28,800",
        usedBy: [
            { name: "空乃ソラ", image: null, fallback: "空" },
        ],
    },
]

// サブカテゴリ
const subcategories = ["全て", "CPU", "GPU", "メモリ", "ストレージ", "マザーボード", "電源", "ケース"]

export default async function PcPartsPage() {
    const user = await getUserNavData()

    return (
        <BaseLayout variant="default" user={user}>
            <div className="flex flex-col gap-6">
                {/* パンくずリスト風ヘッダー */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/items" className="hover:text-primary transition-colors flex items-center gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        アイテムカタログ
                    </Link>
                    <span>/</span>
                    <span className="text-foreground font-medium">PCパーツ</span>
                </div>

                {/* ヘッダー */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Cpu className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">PCパーツ</h1>
                        <p className="text-muted-foreground">
                            VTuber・配信者が使用しているPCパーツ
                        </p>
                    </div>
                </div>

                {/* サブカテゴリフィルター */}
                <div className="flex gap-2 pb-2 overflow-x-auto">
                    {subcategories.map((cat, index) => (
                        <Button
                            key={cat}
                            variant={index === 0 ? "secondary" : "ghost"}
                            size="sm"
                            className="rounded-full"
                        >
                            {cat}
                        </Button>
                    ))}
                </div>

                {/* パーツリスト (4カラムグリッド) */}
                <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {dummyPcParts.map((part) => (
                        <Link key={part.id} href={`/items/pc-parts/${part.id}`}>
                            <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer p-0 gap-0 group">
                                {/* サムネイル画像（正方形） */}
                                <div className="relative aspect-square overflow-hidden bg-muted">
                                    {part.thumbnail ? (
                                        <img
                                            src={part.thumbnail}
                                            alt={part.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                                    )}
                                    {/* カテゴリバッジ + ブランドバッジ */}
                                    <div className="absolute top-2 left-2 flex gap-1">
                                        <Badge variant="secondary" className="text-[10px] h-5 shadow-sm bg-background/80 backdrop-blur-sm">
                                            {part.category}
                                        </Badge>
                                        <Badge variant="outline" className="text-[10px] h-5 shadow-sm bg-background/80 backdrop-blur-sm">
                                            {part.brand}
                                        </Badge>
                                    </div>
                                </div>

                                {/* コンテンツエリア */}
                                <div className="flex flex-col gap-1 p-3">
                                    {/* タイトル */}
                                    <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                                        {part.name}
                                    </h3>

                                    {/* 価格 */}
                                    <span className="text-base font-bold text-primary">
                                        {part.price}
                                    </span>

                                    {/* 使用者 */}
                                    {part.usedBy.length > 0 && (
                                        <div className="flex items-center gap-1 mt-1">
                                            <div className="flex -space-x-2">
                                                {part.usedBy.slice(0, 3).map((user, idx) => (
                                                    <Avatar key={idx} className="h-5 w-5 border-2 border-background">
                                                        <AvatarImage src={user.image || undefined} />
                                                        <AvatarFallback className="text-[8px]">{user.fallback}</AvatarFallback>
                                                    </Avatar>
                                                ))}
                                            </div>
                                            <span className="text-[10px] text-muted-foreground ml-1">
                                                {part.usedBy.length}人が使用中
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </BaseLayout>
    )
}
