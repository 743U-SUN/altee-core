'use client'

import type { BaseSectionProps, BarGraphData } from '@/types/profile-sections'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'

/**
 * 横棒グラフセクション
 * スキルセットや数値データの視覚化に使用
 */
export function BarGraphSection({ section, isEditable }: BaseSectionProps) {
  const data = section.data as BarGraphData

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
      <div className="space-y-4">
        {data.items
          .toSorted((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => {
            const percentage = (item.value / item.maxValue) * 100

            return (
              <div key={item.id} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[var(--theme-text-primary)]">
                    {item.label}
                  </span>
                  <span className="text-sm text-[var(--theme-text-secondary)]">
                    {item.value}/{item.maxValue}
                  </span>
                </div>
                <div className="w-full bg-[var(--theme-surface-bg)] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[var(--theme-accent-bg)] transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
      </div>
    </ThemedCard>
  )
}
