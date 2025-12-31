import { notFound } from 'next/navigation'
import { getProductByIdAction, getCategoriesAction } from '../actions'
import { ProductForm } from '../components/ProductForm'
import { prisma } from '@/lib/prisma'

export const metadata = {
  title: '商品編集 | 管理画面',
  description: '商品を編集',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params

  const [productResult, categoriesResult, brands] = await Promise.all([
    getProductByIdAction(id),
    getCategoriesAction(),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
    }),
  ])

  if (!productResult.success || !productResult.data) {
    notFound()
  }

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : []

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">商品編集</h1>
        <p className="mt-2 text-muted-foreground">
          商品「{productResult.data.name}」を編集
        </p>
      </div>

      <div className="max-w-4xl">
        <ProductForm
          product={productResult.data}
          categories={categories}
          brands={brands}
        />
      </div>
    </div>
  )
}
