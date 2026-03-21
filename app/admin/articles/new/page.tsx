import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { getAdminAllCategories, getAdminAllTags } from '@/lib/queries/article-queries'
import { ArticleForm } from "../components/ArticleForm"

export const metadata: Metadata = {
  title: '新規記事作成 | Admin',
  robots: { index: false, follow: false },
}

export default async function NewArticlePage() {
  await requireAdmin()

  const [categories, tags] = await Promise.all([
    getAdminAllCategories(),
    getAdminAllTags(),
  ])

  return (
    <div className="container mx-auto p-6 pb-40 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">新規記事作成</h1>
        <p className="text-muted-foreground">
          新しい記事を作成します。
        </p>
      </div>

      <ArticleForm initialCategories={categories} initialTags={tags} />
    </div>
  )
}
