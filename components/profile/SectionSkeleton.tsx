import { cn } from '@/lib/utils'

interface SectionSkeletonProps {
  className?: string
}

/**
 * セクションローディング状態のスケルトン
 * SectionBand 内で使用（幅制御はSectionBandが担当）
 */
export function SectionSkeleton({
  className,
}: SectionSkeletonProps) {
  return (
    <div
      className={cn('w-full', className)}
      role="status"
      aria-label="読み込み中"
    >
      <div className="bg-theme-card-bg rounded-theme p-6 shadow-theme animate-pulse">
        {/* ヘッダー部分 */}
        <div className="h-4 w-1/4 bg-theme-bar-bg rounded mb-4" />

        {/* コンテンツ部分 */}
        <div className="space-y-3">
          <div className="h-3 bg-theme-bar-bg rounded w-full" />
          <div className="h-3 bg-theme-bar-bg rounded w-5/6" />
          <div className="h-3 bg-theme-bar-bg rounded w-4/6" />
        </div>
      </div>
    </div>
  )
}
