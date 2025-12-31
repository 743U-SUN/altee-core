import { getCategoriesAction } from '../actions'
import { CategoryListClient } from './CategoryListClient'

export async function CategoryList() {
  const result = await getCategoriesAction()

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{result.error || 'カテゴリの取得に失敗しました'}</p>
      </div>
    )
  }

  return <CategoryListClient categories={result.data} />
}
