import { getCategoriesAction } from '../actions'
import { ProductForm } from '../components/ProductForm'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: '新規商品作成 | 管理画面',
  description: '新しい商品を作成',
}

export default async function NewProductPage() {
  const [categoriesResult, brands] = await Promise.all([
    getCategoriesAction(),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : []

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">新規商品作成</h1>
        <p className="mt-2 text-muted-foreground">
          新しい商品を作成します
        </p>
      </div>

      <div className="max-w-4xl">
        <ProductForm categories={categories} brands={brands} />
      </div>
    </div>
  )
}
