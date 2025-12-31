'use client'

import { ProductCategory } from '@prisma/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Edit, FolderTree } from 'lucide-react'
import { DeleteCategoryButton } from './DeleteCategoryButton'

type CategoryWithRelations = ProductCategory & {
  parent: ProductCategory | null
  children: ProductCategory[]
  _count: {
    products: number
    children: number
  }
}

interface CategoryListClientProps {
  categories: CategoryWithRelations[]
}

export function CategoryListClient({ categories }: CategoryListClientProps) {
  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>カテゴリがありません</CardTitle>
          <CardDescription>
            新規カテゴリを作成してください
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // 階層構造を構築
  const rootCategories = categories.filter((c) => !c.parentId)

  // カテゴリを階層表示用に整形
  const renderCategory = (
    category: CategoryWithRelations,
    level: number = 0
  ) => {
    const children = categories.filter((c) => c.parentId === category.id)

    return (
      <div key={category.id}>
        <Card className="mb-3">
          <CardContent className="pt-6">
            <div
              className="flex items-start justify-between gap-4"
              style={{ paddingLeft: `${level * 2}rem` }}
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {level > 0 && (
                    <FolderTree className="h-4 w-4 text-muted-foreground" />
                  )}
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <Badge variant="outline">{category.slug}</Badge>
                  <Badge>{category.productType}</Badge>
                  {category.requiresCompatibilityCheck && (
                    <Badge variant="secondary">互換性チェック</Badge>
                  )}
                </div>

                {category.description && (
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {category.parent && (
                    <span>
                      親: <strong>{category.parent.name}</strong>
                    </span>
                  )}
                  <span>商品数: {category._count.products}</span>
                  <span>子カテゴリ: {category._count.children}</span>
                  <span>並び順: {category.sortOrder}</span>
                  {category.icon && <span>アイコン: {category.icon}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/categories/${category.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    編集
                  </Link>
                </Button>
                <DeleteCategoryButton
                  categoryId={category.id}
                  categoryName={category.name}
                  hasProducts={category._count.products > 0}
                  hasChildren={category._count.children > 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {children.map((child) => renderCategory(child, level + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">
          全{categories.length}件のカテゴリ（階層構造で表示）
        </p>
      </div>

      {rootCategories.map((category) => renderCategory(category))}
    </div>
  )
}
