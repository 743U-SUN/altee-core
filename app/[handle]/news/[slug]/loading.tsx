import { Skeleton } from '@/components/ui/skeleton'

export default function NewsArticleLoading() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* サムネイル */}
      <Skeleton className="w-full aspect-video rounded-lg" />
      {/* タイトル */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
      {/* 日付 */}
      <Skeleton className="h-4 w-28" />
      {/* 本文 */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  )
}
