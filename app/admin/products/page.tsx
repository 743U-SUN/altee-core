import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, FileUp } from 'lucide-react'
import { ProductList } from './components/ProductList'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: '商品管理 | 管理画面',
  description: '商品の管理',
}

interface PageProps {
  searchParams: Promise<{
    search?: string
    categoryId?: string
    brandId?: string
    page?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">商品管理</h1>
          <p className="mt-2 text-muted-foreground">
            商品の作成・編集・削除
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products/import">
              <FileUp className="mr-2 h-4 w-4" />
              CSV一括登録
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              新規商品
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<ProductListSkeleton />}>
        <ProductList
          search={params.search}
          categoryId={params.categoryId}
          brandId={params.brandId}
          page={params.page ? parseInt(params.page, 10) : 1}
        />
      </Suspense>
    </div>
  )
}

function ProductListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-20 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  )
}
