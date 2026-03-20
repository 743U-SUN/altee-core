import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { ArticleListServer } from './components/ArticleListServer'
import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = {
  title: '記事管理',
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function ArticlesPage({ searchParams }: PageProps) {
  await requireAdmin()
  const { page } = await searchParams
  const currentPage = parseInt(page || '1', 10)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
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

        <Suspense fallback={<div className="text-center py-8">読み込み中...</div>}>
          <ArticleListServer currentPage={currentPage} />
        </Suspense>
      </div>
    </div>
  )
}
