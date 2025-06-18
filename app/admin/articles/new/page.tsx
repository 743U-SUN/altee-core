import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { ArticleForm } from "../components/ArticleForm"

export default async function NewArticlePage() {
  const session = await auth()
  
  // 最終権限チェック（3層目）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">新規記事作成</h1>
        <p className="text-muted-foreground">
          新しい記事を作成します。
        </p>
      </div>

      <ArticleForm />
    </div>
  )
}