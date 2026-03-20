'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface AttributePaginationProps {
  pagination: PaginationData
  /** ページリンクのベースパス（例: "/admin/attributes/categories"） */
  basePath: string
}

/**
 * カテゴリ・タグ一覧で使う共通ページネーションコンポーネント
 */
export function AttributePagination({ pagination, basePath }: AttributePaginationProps) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <div className="text-sm text-muted-foreground">
        {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-
        {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
      </div>
      <div className="flex items-center space-x-2">
        <Link href={`${basePath}?page=${pagination.page - 1}`}>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            前へ
          </Button>
        </Link>
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const page = i + 1
            return (
              <Link key={page} href={`${basePath}?page=${page}`}>
                <Button
                  variant={page === pagination.page ? 'default' : 'outline'}
                  size="sm"
                >
                  {page}
                </Button>
              </Link>
            )
          })}
        </div>
        <Link href={`${basePath}?page=${pagination.page + 1}`}>
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
          >
            次へ
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
