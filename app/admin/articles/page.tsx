import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getArticles } from "@/app/actions/article-actions"
import { ArticleList } from "./components/ArticleList"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  const session = await auth()
  
  // 最終権限チェック（3層目）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)

  try {
    const { articles, pagination } = await getArticles(currentPage, 10)

    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">記事管理</h1>
            <p className="text-muted-foreground">
              記事の作成、編集、削除を行います。
            </p>
          </div>
          <Link href="/admin/articles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規記事作成
            </Button>
          </Link>
        </div>

        <ArticleList 
          articles={articles} 
          pagination={pagination}
        />
      </div>
    )
  } catch (error) {
    console.error('Articles page error:', error)
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">記事管理</h1>
            <p className="text-muted-foreground text-red-600">
              記事の読み込みに失敗しました。
            </p>
          </div>
          <Link href="/admin/articles/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規記事作成
            </Button>
          </Link>
        </div>
        
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            データの取得中にエラーが発生しました。ページを再読み込みしてください。
          </p>
        </div>
      </div>
    )
  }
}