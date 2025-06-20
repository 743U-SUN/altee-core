import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTags } from "@/app/actions/tag-actions"
import { TagList } from "./components/TagList"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function TagsPage({ searchParams }: PageProps) {
  const session = await auth()
  
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)

  try {
    const { tags, pagination } = await getTags(currentPage, 20)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">タグ管理</h2>
            <p className="text-muted-foreground">
              記事のタグを作成、編集、削除します。
            </p>
          </div>
          <Link href="/admin/attributes/tags/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規タグ作成
            </Button>
          </Link>
        </div>

        <TagList 
          tags={tags} 
          pagination={pagination}
        />
      </div>
    )
  } catch (error) {
    console.error('Tags page error:', error)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">タグ管理</h2>
            <p className="text-muted-foreground text-red-600">
              タグの読み込みに失敗しました。
            </p>
          </div>
          <Link href="/admin/attributes/tags/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規タグ作成
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