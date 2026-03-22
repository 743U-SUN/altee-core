import { Skeleton } from '@/components/ui/skeleton'

export default function VideosLoading() {
  return (
    <div className="w-full space-y-4 p-6">
      {/* 動画セクションスケルトン × 2 */}
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-lg" />
      ))}
    </div>
  )
}
