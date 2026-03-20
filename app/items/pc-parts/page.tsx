import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUserNavData } from "@/lib/user-data"
import { prisma } from "@/lib/prisma"
import { Cpu, ChevronLeft, ChevronRight, Package } from "lucide-react"
import { getPublicUrl } from "@/lib/image-uploader/get-public-url"

export const metadata: Metadata = {
  title: 'PCパーツ | Altee',
  description: 'VTuber・配信者が使用しているPCパーツの一覧。CPU、GPU、マザーボードなどのスペックと使用者情報を確認できます。',
}

const ITEMS_PER_PAGE = 20

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string }>
}

async function getPcPartItems(page: number, categorySlug?: string) {
  const where = {
    category: {
      itemType: 'PC_PART' as const,
      ...(categorySlug ? { slug: categorySlug } : {}),
    },
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        category: true,
        brand: true,
        pcPartSpec: { select: { partType: true } },
        _count: { select: { buildParts: true } },
        buildParts: {
          take: 3,
          where: { build: { isPublic: true } },
          include: {
            build: {
              include: {
                user: {
                  select: {
                    handle: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.item.count({ where }),
  ])

  return { items, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) }
}

async function getPcPartCategories() {
  return prisma.itemCategory.findMany({
    where: { itemType: 'PC_PART' },
    orderBy: { sortOrder: 'asc' },
  })
}

export default async function PcPartsPage({ searchParams }: PageProps) {
  const { page: pageStr, category } = await searchParams
  const page = Math.min(Math.max(1, Number(pageStr) || 1), 1000)

  const [user, { items, total, totalPages }, categories] = await Promise.all([
    getUserNavData(),
    getPcPartItems(page, category),
    getPcPartCategories(),
  ])

  // ページネーション用 URL ヘルパー
  const buildUrl = (p: number, cat?: string) => {
    const params = new URLSearchParams()
    if (p > 1) params.set('page', String(p))
    if (cat) params.set('category', cat)
    const qs = params.toString()
    return `/items/pc-parts${qs ? `?${qs}` : ''}`
  }

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
              VTuber・配信者が使用しているPCパーツ（{total}件）
            </p>
          </div>
        </div>

        {/* カテゴリフィルター — Link ベース */}
        <div className="flex gap-2 pb-2 overflow-x-auto">
          <Link href={buildUrl(1)}>
            <Button
              variant={!category ? 'secondary' : 'ghost'}
              size="sm"
              className="rounded-full"
            >
              全て
            </Button>
          </Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={buildUrl(1, cat.slug)}>
              <Button
                variant={category === cat.slug ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-full"
              >
                {cat.name}
              </Button>
            </Link>
          ))}
        </div>

        {/* パーツリスト */}
        {items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>PCパーツがまだ登録されていません</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => {
              const imageUrl = item.imageStorageKey
                ? getPublicUrl(item.imageStorageKey)
                : null
              const usedByCount = item._count.buildParts

              return (
                <Link key={item.id} href={`/items/pc-parts/${item.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer p-0 gap-0 group">
                    {/* サムネイル画像 */}
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain p-2"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1">
                        <Badge variant="secondary" className="text-[10px] h-5 shadow-sm bg-background/80 backdrop-blur-sm">
                          {item.category.name}
                        </Badge>
                        {item.brand && (
                          <Badge variant="outline" className="text-[10px] h-5 shadow-sm bg-background/80 backdrop-blur-sm">
                            {item.brand.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* コンテンツ */}
                    <div className="flex flex-col gap-1 p-3">
                      <h3 className="font-bold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>

                      {/* 使用者 */}
                      {usedByCount > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex -space-x-2">
                            {item.buildParts.slice(0, 3).map((bp) => (
                              <Avatar key={bp.id} className="h-5 w-5 border-2 border-background">
                                <AvatarImage src={bp.build.user.image || undefined} />
                                <AvatarFallback className="text-[8px]">
                                  {(bp.build.user.name || '?')[0]}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {usedByCount}人が使用中
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {page > 1 ? (
              <Link href={buildUrl(page - 1, category)}>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  前へ
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="h-4 w-4 mr-1" />
                前へ
              </Button>
            )}

            <span className="text-sm text-muted-foreground px-2">
              {page} / {totalPages}
            </span>

            {page < totalPages ? (
              <Link href={buildUrl(page + 1, category)}>
                <Button variant="outline" size="sm">
                  次へ
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>
                次へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        )}
      </div>
    </BaseLayout>
  )
}
