'use client'

import { ItemCategory, Brand } from '@prisma/client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { DeleteItemButton } from './DeleteItemButton'
import { useState } from 'react'
import Image from 'next/image'

type ItemWithRelations = {
  id: string
  name: string
  description: string | null
  asin: string | null
  customImageUrl: string | null
  amazonImageUrl: string | null
  createdAt: string
  category: ItemCategory
  brand: Brand | null
  _count: {
    userItems: number
  }
}

interface ItemListClientProps {
  items: ItemWithRelations[]
  total: number
  page: number
  totalPages: number
  categories: ItemCategory[]
  brands: Brand[]
  currentFilters: {
    search?: string
    categoryId?: string
    brandId?: string
  }
}

export function ItemListClient({
  items,
  total,
  page,
  totalPages,
  categories,
  brands,
  currentFilters,
}: ItemListClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')

  const updateFilters = (filters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    // ページをリセット（フィルタ変更時）
    if (filters.search !== undefined || filters.categoryId !== undefined || filters.brandId !== undefined) {
      params.delete('page')
    }

    router.push(`/admin/items?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchValue })
  }

  if (items.length === 0 && !currentFilters.search && !currentFilters.categoryId && !currentFilters.brandId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>アイテムがありません</CardTitle>
          <CardDescription>
            新規アイテムを作成してください
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィルタ */}
      <Card>
        <CardHeader>
          <CardTitle>フィルタ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                placeholder="アイテム名で検索..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            <Select
              value={currentFilters.categoryId || 'all'}
              onValueChange={(value) =>
                updateFilters({ categoryId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="カテゴリで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全カテゴリ</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentFilters.brandId || 'all'}
              onValueChange={(value) =>
                updateFilters({ brandId: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="ブランドで絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全ブランド</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* アイテム一覧 */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          全{total}件のアイテム（{page}/{totalPages}ページ目）
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              条件に一致するアイテムが見つかりませんでした
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* 画像 */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                    {item.customImageUrl || item.amazonImageUrl ? (
                      <Image
                        src={item.customImageUrl || item.amazonImageUrl || ''}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                        画像なし
                      </div>
                    )}
                  </div>

                  {/* アイテム情報 */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      {item.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{item.category.name}</Badge>
                      {item.brand && <Badge>{item.brand.name}</Badge>}
                      {item.asin && (
                        <Badge variant="secondary">ASIN: {item.asin}</Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      登録ユーザー: {item._count.userItems}人 | 作成:{' '}
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* アクション */}
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/items/${item.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        編集
                      </Link>
                    </Button>
                    <DeleteItemButton
                      itemId={item.id}
                      itemName={item.name}
                      hasUsers={item._count.userItems > 0}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', String(page - 1))
              router.push(`/admin/items?${params.toString()}`)
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            前へ
          </Button>

          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.set('page', String(page + 1))
              router.push(`/admin/items?${params.toString()}`)
            }}
          >
            次へ
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
