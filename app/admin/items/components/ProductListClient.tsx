'use client'

import { Product, ProductCategory, Brand } from '@prisma/client'
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
import { DeleteProductButton } from './DeleteProductButton'
import { useState } from 'react'
import Image from 'next/image'

type ProductWithRelations = Product & {
  category: ProductCategory
  brand: Brand | null
  _count: {
    userProducts: number
  }
}

interface ProductListClientProps {
  products: ProductWithRelations[]
  total: number
  page: number
  totalPages: number
  categories: ProductCategory[]
  brands: Brand[]
  currentFilters: {
    search?: string
    categoryId?: string
    brandId?: string
  }
}

export function ProductListClient({
  products,
  total,
  page,
  totalPages,
  categories,
  brands,
  currentFilters,
}: ProductListClientProps) {
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

    router.push(`/admin/products?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchValue })
  }

  if (products.length === 0 && !currentFilters.search && !currentFilters.categoryId && !currentFilters.brandId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>商品がありません</CardTitle>
          <CardDescription>
            新規商品を作成してください
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
                placeholder="商品名で検索..."
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

      {/* 商品一覧 */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          全{total}件の商品（{page}/{totalPages}ページ目）
        </p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              条件に一致する商品が見つかりませんでした
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  {/* 画像 */}
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border">
                    {product.customImageUrl || product.amazonImageUrl ? (
                      <Image
                        src={product.customImageUrl || product.amazonImageUrl || ''}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground">
                        画像なし
                      </div>
                    )}
                  </div>

                  {/* 商品情報 */}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      {product.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{product.category.name}</Badge>
                      {product.brand && <Badge>{product.brand.name}</Badge>}
                      {product.asin && (
                        <Badge variant="secondary">ASIN: {product.asin}</Badge>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      登録ユーザー: {product._count.userProducts}人 | 作成:{' '}
                      {new Date(product.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* アクション */}
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/products/${product.id}`}>
                        <Edit className="mr-2 h-4 w-4" />
                        編集
                      </Link>
                    </Button>
                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                      hasUsers={product._count.userProducts > 0}
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
              router.push(`/admin/products?${params.toString()}`)
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
              router.push(`/admin/products?${params.toString()}`)
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
