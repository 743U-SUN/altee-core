import { getItemsAction, getCategoriesAction } from '../actions'
import { ItemListClient } from './ItemListClient'
import { prisma } from '@/lib/prisma'

interface ItemListProps {
  search?: string
  categoryId?: string
  brandId?: string
  page?: number
}

export async function ItemList({
  search,
  categoryId,
  brandId,
  page = 1,
}: ItemListProps) {
  const [itemsResult, categoriesResult, brands] = await Promise.all([
    getItemsAction({ search, categoryId, brandId, page }),
    getCategoriesAction(),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  if (!itemsResult.success || !itemsResult.data) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          {itemsResult.error || 'アイテムの取得に失敗しました'}
        </p>
      </div>
    )
  }

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : []

  const serializedItems = itemsResult.data.items.map((item) => ({
    ...item,
    createdAt: item.createdAt.toISOString(),
  }))

  return (
    <ItemListClient
      items={serializedItems}
      total={itemsResult.data.total}
      page={itemsResult.data.page}
      totalPages={itemsResult.data.totalPages}
      categories={categories}
      brands={brands}
      currentFilters={{
        search,
        categoryId,
        brandId,
      }}
    />
  )
}
