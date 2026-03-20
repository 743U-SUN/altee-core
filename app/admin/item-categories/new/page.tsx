import { getCategoriesAction } from '../actions'
import { CategoryForm } from '../components/CategoryForm'
import { requireAdmin } from '@/lib/auth'

export const metadata = {
  title: '新規カテゴリ作成 | 管理画面',
  description: '新しいアイテムカテゴリを作成',
}

export default async function NewCategoryPage() {
  await requireAdmin()
  const result = await getCategoriesAction()
  const categories = result.success && result.data ? result.data : []

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">新規カテゴリ作成</h1>
        <p className="mt-2 text-muted-foreground">
          新しいアイテムカテゴリを作成します
        </p>
      </div>

      <div className="max-w-3xl">
        <CategoryForm categories={categories} />
      </div>
    </div>
  )
}
