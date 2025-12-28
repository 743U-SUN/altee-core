"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface MediaPaginationProps {
  pagination: Pagination
}

export function MediaPagination({ pagination }: MediaPaginationProps) {
  const router = useRouter()

  if (pagination.totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-
        {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={page === pagination.page ? "default" : "outline"}
            size="sm"
            onClick={() => {
              const params = new URLSearchParams(window.location.search)
              params.set('page', page.toString())
              router.push(`?${params.toString()}`)
            }}
          >
            {page}
          </Button>
        ))}
      </div>
    </div>
  )
}
