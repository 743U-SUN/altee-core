import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { BaseLayout } from '@/components/layout/BaseLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { getUserNavData } from '@/lib/user-data'
import { prisma } from '@/lib/prisma'
import { ChevronLeft, ExternalLink, Package, Users } from 'lucide-react'
import { pcPartTypeLabels } from '@/lib/validations/pc-build'
import { specFieldsByType } from '@/lib/validations/pc-part-specs'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'

interface PageProps {
  params: Promise<{ id: string }>
}

const getItemDetail = cache(async (id: string) => {
  return prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
      brand: true,
      pcPartSpec: {
        include: {
          chipMaker: true,
        },
      },
      buildParts: {
        where: {
          build: {
            isPublic: true,
          },
        },
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
  })
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const item = await getItemDetail(id)
  if (!item) return { title: 'Not Found' }
  return {
    title: `${item.name} | PCパーツ | Altee`,
    description: item.description || `${item.name}のスペック・使用者一覧`,
  }
}

export default async function PcPartDetailPage({ params }: PageProps) {
  const { id } = await params
  const [user, item] = await Promise.all([
    getUserNavData(),
    getItemDetail(id),
  ])

  if (!item) notFound()

  const imageUrl = item.imageStorageKey
    ? getPublicUrl(item.imageStorageKey)
    : null

  const spec = item.pcPartSpec
  const specFields = spec ? specFieldsByType[spec.partType] : []
  const specs = spec?.specs as Record<string, unknown> | undefined

  return (
    <BaseLayout variant="default" user={user}>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* パンくず */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/items/pc-parts" className="hover:text-primary transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            PCパーツ
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{item.name}</span>
        </div>

        {/* メイン情報 */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* 画像 */}
          <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={item.name}
                width={400}
                height={400}
                className="object-contain p-4"
              />
            ) : (
              <Package className="h-24 w-24 text-muted-foreground/30" />
            )}
          </div>

          {/* 詳細 */}
          <div className="space-y-4">
            <div>
              <div className="flex gap-2 mb-2">
                <Badge>{item.category.name}</Badge>
                {item.brand && <Badge variant="outline">{item.brand.name}</Badge>}
                {spec && <Badge variant="secondary">{pcPartTypeLabels[spec.partType]}</Badge>}
              </div>
              <h1 className="text-2xl font-bold">{item.name}</h1>
              {item.description && (
                <p className="text-muted-foreground mt-2">{item.description}</p>
              )}
            </div>

            {spec?.chipMaker && (
              <div className="text-sm">
                <span className="text-muted-foreground">チップメーカー: </span>
                <span className="font-medium">{spec.chipMaker.name}</span>
              </div>
            )}

            {spec?.tdp && (
              <div className="text-sm">
                <span className="text-muted-foreground">TDP: </span>
                <span className="font-medium">{spec.tdp}W</span>
              </div>
            )}

            {item.amazonUrl && (
              <Link
                href={item.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Amazonで見る
              </Link>
            )}

            {/* 使用者数 */}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{item.buildParts.length}人</span>
              <span className="text-muted-foreground">が使用中</span>
            </div>
          </div>
        </div>

        {/* スペック表 */}
        {specs && specFields && specFields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">スペック</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {specFields.map((field) => {
                  const value = specs[field.key]
                  if (value === undefined || value === null || value === '') return null
                  const displayValue = Array.isArray(value)
                    ? value.join(', ')
                    : String(value)
                  return (
                    <div key={field.key} className="flex justify-between py-1.5 border-b last:border-0">
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                      <span className="text-sm font-medium">
                        {displayValue}
                        {field.unit && ` ${field.unit}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用者一覧 */}
        {item.buildParts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">使用者</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {item.buildParts.map((bp) => (
                  <Link
                    key={bp.id}
                    href={`/@${bp.build.user.handle}/items`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={bp.build.user.image || undefined} />
                      <AvatarFallback>
                        {(bp.build.user.name || '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{bp.build.user.name || bp.build.user.handle}</p>
                      <p className="text-xs text-muted-foreground">@{bp.build.user.handle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </BaseLayout>
  )
}
