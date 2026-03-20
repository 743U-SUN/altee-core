import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { getAllCategories } from "@/app/actions/content/category-actions"
import { getAllTags } from "@/app/actions/content/tag-actions"
import { ArticleForm } from "../components/ArticleForm"

export default async function NewArticlePage() {
  const session = await cachedAuth()

  // 最終権限チェック（3層目）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const [categories, tags] = await Promise.all([
    getAllCategories(),
    getAllTags(),
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