import { Skeleton } from '@/components/ui/skeleton'

export default function FaqsLoading() {
  return (
    <div className="w-full space-y-6 p-6">
      {/* FAQカテゴリカード × 3 */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          {/* カテゴリ名 */}
          <Skeleton className="h-6 w-40" />
          {/* Q&Aアイテム × 3 */}
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
