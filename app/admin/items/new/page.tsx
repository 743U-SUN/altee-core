import { getCategoriesAction } from '../actions'
import { ItemForm } from '../components/ItemForm'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export const metadata = {
  title: '新規アイテム作成 | 管理画面',
  description: '新しいアイテムを作成',
}

export default async function NewItemPage() {
  await requireAdmin()
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
        <h1 className="text-3xl font-bold">新規アイテム作成</h1>
        <p className="mt-2 text-muted-foreground">
          新しいアイテムを作成します
        </p>
      </div>

      <div className="max-w-4xl">
        <ItemForm categories={categories} brands={brands} />
      </div>
    </div>
  )
}
