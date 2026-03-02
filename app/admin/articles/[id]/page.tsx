import { cachedAuth } from '@/lib/auth'
import { redirect, notFound } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { getArticle } from "@/app/actions/content/article-actions"
import { getAllCategories } from "@/app/actions/content/category-actions"
import { getAllTags } from "@/app/actions/content/tag-actions"
import { ArticleForm } from "../components/ArticleForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
  const session = await cachedAuth()

  // 最終権限チェック（3層目）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params

  try {
    const [article, categories, tags] = await Promise.all([
      getArticle(id),
      getAllCategories(),
      getAllTags(),
    ])

    return (
      <div className="container mx-auto p-6 pb-40 space-y-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight">記事編集</h1>
          <p className="text-muted-foreground">
            「{article.title}」を編集します。
          </p>
        </div>

        <ArticleForm
          article={article}
          initialCategories={categories}
          initialTags={tags}
        />
      </div>
    )
  } catch (error) {
    if (isRedirectError(error)) throw error
    notFound()
  }
}