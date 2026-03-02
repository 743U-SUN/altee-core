import Image from 'next/image'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import type { BaseSectionProps, WeeklyScheduleData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge, Divider } from '@/components/decorations'
import { getDayInfo } from './weekly-schedule-utils'

/**
 * 週間スケジュールセクション
 * 開始日から1週間分の予定をリスト表示
 */
export function WeeklyScheduleSection({ section }: BaseSectionProps) {
  const data = section.data as WeeklyScheduleData

  // startDate が未設定の場合は非表示（予定が全て空でも表示する）
  if (!data.startDate) return null

  const schedules = data.schedules ?? Array(7).fill('')

  return (
    <ThemedCard showCornerDecor className="relative overflow-hidden w-full mb-6">
      {/* 右下背景画像（カード内に収め、角丸・余白あり） */}
      {data.imageKey && (
        <div className="absolute bottom-4 right-4 w-32 h-32 md:w-40 md:h-40 opacity-50 pointer-events-none rounded-xl overflow-hidden">
          <Image
            src={getPublicUrl(data.imageKey)}
            alt=""
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>
      )}

      {/* コンテンツ（画像より前面） */}
      <div className="relative z-10">
        {/* セクションタイトル */}
        {section.title && (
          <Badge variant="accent" className="mb-4">
            {section.title}
          </Badge>
        )}

        {/* スケジュールリスト */}
        <div className="space-y-0">
          {schedules.slice(0, 7).map((schedule, offset) => {
            const { weekday, label } = getDayInfo(data.startDate, offset)
            return (
              <div key={offset}>
                {offset > 0 && <Divider className="my-3" />}
                <div className="flex items-center gap-3 pr-8 md:pr-12">
                  {/* 漢字曜日バッジ */}
                  <div className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold bg-[var(--theme-accent-bg,rgba(176,125,79,0.1))] text-[var(--theme-text-accent,#b07d4f)]">
                    {weekday}
                  </div>
                  {/* 日付 */}
                  <span className="shrink-0 text-xs text-[var(--theme-text-secondary)] w-10">
                    {label}
                  </span>
                  {/* 予定テキスト */}
                  <span className="text-sm text-[var(--theme-text-primary)] leading-relaxed min-w-0 break-words">
                    {schedule || (
                      <span className="text-[var(--theme-text-secondary)] opacity-50">—</span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ThemedCard>
  )
}
