import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getArticle } from "@/app/actions/article-actions"
import { ArticleForm } from "../components/ArticleForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
  const session = await auth()
  
  // 最終権限チェック（3層目）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params

  try {
    const article = await getArticle(id)
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">記事編集</h1>
          <p className="text-muted-foreground">
            「{article.title}」を編集します。
          </p>
        </div>

        <ArticleForm article={article} />
      </div>
    )
  } catch (error) {
    console.error('Article fetch error:', error)
    notFound()
  }
}