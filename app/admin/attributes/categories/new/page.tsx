import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { CategoryForm } from "../components/CategoryForm"

export const metadata: Metadata = {
  title: '新規カテゴリ作成 | Admin',
  robots: { index: false, follow: false },
}

export default async function NewCategoryPage() {
  await requireAdmin()

  return <CategoryForm mode="create" />
}
