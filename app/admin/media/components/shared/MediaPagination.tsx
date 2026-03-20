"use client"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useRouter } from "next/navigation"
import type { MediaPaginationData } from "@/types/media"

interface MediaPaginationProps {
  pagination: MediaPaginationData
}

export function MediaPagination({ pagination }: MediaPaginationProps) {
  const router = useRouter()

  if (pagination.totalPages <= 1) return null

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', page.toString())
    return `?${params.toString()}`
  }

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const delta = 2
    const pages: (number | 'ellipsis')[] = []

    pages.push(1)

    const start = Math.max(2, pagination.page - delta)
    const end = Math.min(pagination.totalPages - 1, pagination.page + delta)

    if (start > 2) {
      pages.push('ellipsis')
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < pagination.totalPages - 1) {
      pages.push('ellipsis')
    }

    if (pagination.totalPages > 1) {
      pages.push(pagination.totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()
  const startItem = (pagination.page - 1) * pagination.limit + 1
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {pagination.total}件中 {startItem}-{endItem}件を表示
      </div>
      <Pagination>
        <PaginationContent>
          {pagination.page > 1 && (
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  router.push(getPageUrl(pagination.page - 1))
                }}
              />
            </PaginationItem>
          )}

          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  href="#"
                  isActive={page === pagination.page}
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(getPageUrl(page))
                  }}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          {pagination.page < pagination.totalPages && (
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  router.push(getPageUrl(pagination.page + 1))
                }}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  )
}
