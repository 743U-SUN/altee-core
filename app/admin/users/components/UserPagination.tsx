import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface UserPaginationProps {
  currentPage: number
  totalPages: number
  totalCount: number
  baseUrl: string
  search?: string
  role?: string
  isActive?: string
  createdFrom?: string
  createdTo?: string
}

export function UserPagination({ 
  currentPage, 
  totalPages, 
  totalCount, 
  baseUrl,
  search,
  role,
  isActive,
  createdFrom,
  createdTo
}: UserPaginationProps) {
  if (totalPages <= 1) return null

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', page.toString())
    if (search) params.set('search', search)
    if (role) params.set('role', role)
    if (isActive) params.set('isActive', isActive)
    if (createdFrom) params.set('createdFrom', createdFrom)
    if (createdTo) params.set('createdTo', createdTo)
    return `${baseUrl}?${params.toString()}`
  }

  const getVisiblePages = () => {
    const delta = 2
    const pages: (number | 'ellipsis')[] = []
    
    // 最初のページは常に表示
    pages.push(1)
    
    // 現在のページ周辺のページ
    const start = Math.max(2, currentPage - delta)
    const end = Math.min(totalPages - 1, currentPage + delta)
    
    // 開始位置に省略記号が必要か
    if (start > 2) {
      pages.push('ellipsis')
    }
    
    // 中間のページ
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    // 終了位置に省略記号が必要か
    if (end < totalPages - 1) {
      pages.push('ellipsis')
    }
    
    // 最後のページ（最初のページと同じでなければ）
    if (totalPages > 1) {
      pages.push(totalPages)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()
  const startItem = (currentPage - 1) * 20 + 1
  const endItem = Math.min(currentPage * 20, totalCount)

  return (
    <div className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        {totalCount}件中 {startItem}-{endItem}件を表示
      </div>
      
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious href={getPageUrl(currentPage - 1)} />
            </PaginationItem>
          )}
          
          {visiblePages.map((page, index) => (
            <PaginationItem key={index}>
              {page === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink 
                  href={getPageUrl(page)}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext href={getPageUrl(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  )
}