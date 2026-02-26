'use client'

import type { BaseSectionProps, CircularStatData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'
import { getLucideIcon } from '@/lib/lucide-icons'

/**
 * 円形スタットセクション
 * ステータスや数値データの視覚化に使用
 */
export function CircularStatSection({ section }: BaseSectionProps) {
  const data = section.data as CircularStatData

  if (!data.items || data.items.length === 0) {
    return (
      <ThemedCard className="w-full mb-6">
        <p className="text-[var(--theme-text-secondary)] text-center py-4">
          データがありません
        </p>
      </ThemedCard>
    )
  }

  return (
    <ThemedCard showCornerDecor className="w-full mb-6">
      {section.title && (
        <Badge variant="accent" className="mb-3">
          {section.title}
        </Badge>
      )}

      {/* 3 items per row on all devices */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {data.items
          .toSorted((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => {
            const Icon = item.iconName ? getLucideIcon(item.iconName) : null
            const strokeDashoffset = 251.2 * (1 - item.value / 100)

            return (
              <div key={item.id} className="flex flex-col items-center">
                {/* SVG Circle */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex items-center justify-center">
                  <svg
                    className="w-full h-full -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    {/* Background Track */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="var(--theme-surface-bg, #d5d1cc)"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray="251.2"
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Center Character */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-lg sm:text-2xl md:text-3xl font-black"
                      style={{ color: item.color }}
                    >
                      {item.centerChar}
                    </span>
                  </div>
                </div>

                {/* Labels */}
                <div className="mt-1 sm:mt-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {Icon && (
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--theme-text-secondary)]" />
                    )}
                    <span className="font-bold text-[10px] sm:text-xs md:text-sm text-[var(--theme-text-primary)]">
                      {item.label}
                    </span>
                  </div>
                  {item.subLabel && (
                    <div className="text-[8px] sm:text-[10px] text-[var(--theme-text-secondary)] font-bold mt-0.5">
                      {item.subLabel}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
      </div>
    </ThemedCard>
  )
}
