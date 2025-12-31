import { getProductsAction, getCategoriesAction } from '../actions'
import { ProductListClient } from './ProductListClient'
import { prisma } from '@/lib/prisma'

interface ProductListProps {
  search?: string
  categoryId?: string
  brandId?: string
  page?: number
}

export async function ProductList({
  search,
  categoryId,
  brandId,
  page = 1,
}: ProductListProps) {
  const [productsResult, categoriesResult, brands] = await Promise.all([
    getProductsAction({ search, categoryId, brandId, page }),
    getCategoriesAction(),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  if (!productsResult.success || !productsResult.data) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          {productsResult.error || '商品の取得に失敗しました'}
        </p>
      </div>
    )
  }

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : []

  return (
    <ProductListClient
      products={productsResult.data.products}
      total={productsResult.data.total}
      page={productsResult.data.page}
      totalPages={productsResult.data.totalPages}
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
