import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { notFound } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { getArticle } from "@/app/actions/content/article-actions"
import { getAdminAllCategories, getAdminAllTags } from '@/lib/queries/article-queries'
import { ArticleForm } from "../components/ArticleForm"

export const metadata: Metadata = {
  title: '記事編集 | Admin',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
  await requireAdmin()

  const { id } = await params

  try {
    const [articleRaw, categories, tags] = await Promise.all([
      getArticle(id),
      getAdminAllCategories(),
      getAdminAllTags(),
    ])

    const article = {
      ...articleRaw,
      createdAt: articleRaw.createdAt.toISOString(),
      updatedAt: articleRaw.updatedAt.toISOString(),
      publishedAt: articleRaw.publishedAt?.toISOString() ?? null,
    }

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
