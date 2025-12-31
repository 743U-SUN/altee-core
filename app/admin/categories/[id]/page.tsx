import { notFound } from 'next/navigation'
import { getCategoryByIdAction, getCategoriesAction } from '../actions'
import { CategoryForm } from '../components/CategoryForm'

export const metadata = {
  title: 'カテゴリ編集 | 管理画面',
  description: '商品カテゴリを編集',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params
  const [categoryResult, categoriesResult] = await Promise.all([
    getCategoryByIdAction(id),
    getCategoriesAction(),
  ])

  if (!categoryResult.success || !categoryResult.data) {
    notFound()
  }

  const categories = categoriesResult.success && categoriesResult.data ? categoriesResult.data : []

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">カテゴリ編集</h1>
        <p className="mt-2 text-muted-foreground">
          カテゴリ「{categoryResult.data.name}」を編集
        </p>
      </div>

      <div className="max-w-3xl">
        <CategoryForm
          category={categoryResult.data}
          categories={categories}
        />
      </div>
    </div>
  )
}
