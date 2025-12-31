import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { CategoryList } from './components/CategoryList'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
  title: 'カテゴリ管理 | 管理画面',
  description: 'アイテムカテゴリの管理',
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">カテゴリ管理</h1>
          <p className="mt-2 text-muted-foreground">
            アイテムカテゴリの作成・編集・削除
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/item-categories/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規カテゴリ
          </Link>
        </Button>
      </div>

      <Suspense fallback={<CategoryListSkeleton />}>
        <CategoryList />
      </Suspense>
    </div>
  )
}

function CategoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  )
}
