import { Skeleton } from '@/components/ui/skeleton'

export default function NewsLoading() {
  return (
    <div className="w-full space-y-4 p-6">
      {/* ニュースカード × 5 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-lg border">
          {/* サムネイル */}
          <Skeleton className="w-24 h-[72px] sm:w-32 sm:h-24 rounded flex-shrink-0" />
          {/* テキスト */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
