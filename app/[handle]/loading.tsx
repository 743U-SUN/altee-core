import { Skeleton } from '@/components/ui/skeleton'

export default function HandleLoading() {
  return (
    <div className="flex min-h-screen">
      {/* キャラクターカラム */}
      <div className="hidden md:flex flex-col w-80 shrink-0 p-4 gap-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="flex-1 w-full rounded-lg" />
      </div>
      {/* コンテンツカラム */}
      <div className="flex-1 p-6 space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}
