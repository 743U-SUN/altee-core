import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { getAdminCategories } from '@/lib/queries/article-queries'
import { CategoryList } from "./components/CategoryList"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'カテゴリ管理 | Admin',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  await requireAdmin()

  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)

  try {
    const { categories, pagination } = await getAdminCategories(currentPage, 20)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">カテゴリ管理</h2>
            <p className="text-muted-foreground">
              記事のカテゴリを作成、編集、削除します。
            </p>
          </div>
          <Link href="/admin/attributes/categories/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規カテゴリ作成
            </Button>
          </Link>
        </div>

        <CategoryList
          categories={categories.map((c) => ({
            ...c,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          }))}
          pagination={pagination}
        />
      </div>
    )
  } catch {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">カテゴリ管理</h2>
            <p className="text-muted-foreground text-red-600">
              カテゴリの読み込みに失敗しました。
            </p>
          </div>
          <Link href="/admin/attributes/categories/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新規カテゴリ作成
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
