import type { BaseSectionProps, TimelineData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'
import { getLucideIcon } from '@/lib/lucide-icons'

/**
 * 活動年表（Timeline）セクション
 * 縦ラインに沿って活動の歴史を表示
 * デスクトップ: 左右交互レイアウト
 * モバイル: 左寄せレイアウト
 */
export function TimelineSection({ section }: BaseSectionProps) {
  const data = section.data as TimelineData
  const items = (data?.items ?? []).toSorted(
    (a, b) => a.sortOrder - b.sortOrder
  )

  if (items.length === 0) {
    return null
  }

  return (
    <ThemedCard className="w-full mb-6 relative">
      {section.title && (
        <Badge variant="accent" className="mb-4">
          {section.title}
        </Badge>
      )}

      {/* Central Vertical Line */}
      <div
        className="absolute left-[54px] md:left-1/2 top-16 bottom-10 w-px -ml-px border-l-2 border-dotted border-[var(--theme-text-accent,#b07d4f)] opacity-40"
        aria-hidden="true"
      />

      <div className="space-y-12 relative pt-4">
        {items.map((item, index) => {
          const isRight = index % 2 === 0
          const LucideIconComponent = getLucideIcon(item.iconName)

          return (
            <div key={item.id} className="flex flex-col md:flex-row items-start w-full relative">
              {/* Center Dot */}
              <div className="absolute left-[24px] md:left-1/2 top-[15px] md:-ml-[6px] w-[12px] h-[12px] rounded-full bg-[var(--theme-text-accent,#b07d4f)] z-20 shadow-sm ring-4 ring-[var(--theme-card-bg,#e8e4df)]" />

              {/* Left Side (Desktop Only for odd index) */}
              <div className={`w-full md:w-1/2 md:pr-10 ${isRight ? 'hidden md:block md:invisible' : 'hidden md:block'}`}>
                <div className="flex flex-col items-end">
                  {/* Horizontal Line & Icon */}
                  <div className="flex items-center justify-end w-full mb-2 relative">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--theme-text-accent,#b07d4f)] shrink-0 z-10 mr-2 bg-[var(--theme-card-bg,#e8e4df)] shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff]">
                      <LucideIconComponent className="w-5 h-5" />
                    </div>
                    {/* Line */}
                    <div className="h-[2px] flex-1 bg-[var(--theme-text-accent,#b07d4f)] opacity-60 rounded-full relative">
                      {/* Label on Line */}
                      <span className="absolute -top-6 right-0 font-bold text-[var(--theme-text-accent,#b07d4f)] tracking-wider text-sm">
                        {item.label}
                      </span>
                    </div>
                  </div>

                  {/* Content Box */}
                  <div className="w-full text-right">
                    <h3 className="font-bold text-lg text-[var(--theme-text-primary)] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Side (Desktop for even, All for Mobile) */}
              <div className={`w-full md:w-1/2 pl-12 md:pl-10 ${!isRight ? 'block md:invisible' : 'block'}`}>
                <div className="relative flex flex-col items-start">
                  {/* Horizontal Line & Icon */}
                  <div className="flex items-center justify-start w-full mb-2 relative">
                    {/* Line */}
                    <div className="h-[2px] flex-1 bg-[var(--theme-text-accent,#b07d4f)] opacity-60 rounded-full relative">
                      {/* Label on Line */}
                      <span className="absolute -top-6 left-0 font-bold text-[var(--theme-text-accent,#b07d4f)] tracking-wider text-sm">
                        {item.label}
                      </span>
                    </div>
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--theme-text-accent,#b07d4f)] shrink-0 z-10 ml-2 bg-[var(--theme-card-bg,#e8e4df)] shadow-[inset_2px_2px_5px_#babecc,inset_-5px_-5px_10px_#ffffff]">
                      <LucideIconComponent className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Content Box */}
                  <div className="w-full text-left">
                    <h3 className="font-bold text-lg text-[var(--theme-text-primary)] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[var(--theme-text-secondary)] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ThemedCard>
  )
}
