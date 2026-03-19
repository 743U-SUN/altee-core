import type { BaseSectionProps, LinkListData } from '@/types/profile-sections'
import { ExternalLink, ChevronRight } from 'lucide-react'
import { getLucideIcon } from '@/lib/lucide-icons'
import Image from 'next/image'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'
import { isSafeUrl } from '@/lib/validations/shared'

/**
 * リンクリストセクション
 * リンク一覧（カード形式、URL非表示）
 */
export function LinkListSection({ section, isEditable: _isEditable }: BaseSectionProps) {
  const data = section.data as LinkListData

  if (!data.items || data.items.length === 0) {
    return null
  }

  return (
    <ThemedCard size="md" className="w-full mb-6">
      {section.title && (
        <Badge variant="accent" className="mb-4">
          {section.title}
        </Badge>
      )}

      <div className="flex flex-col gap-3">
        {data.items
          .toSorted((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => {
            const LucideIconComponent =
              item.iconType === 'lucide' && item.lucideIconName
                ? getLucideIcon(item.lucideIconName)
                : null

            return (
              <a
                key={item.id}
                href={isSafeUrl(item.url) ? item.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-4 rounded-lg hover:bg-theme-bar-bg/50 transition-all duration-300"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Icon - 円形コンテナ */}
                  <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-theme-bar-bg text-[var(--theme-accent-color,var(--theme-text-secondary))]">
                    {item.iconType === 'custom' && item.customIconUrl ? (
                      <Image
                        src={item.customIconUrl}
                        alt={item.title}
                        width={24}
                        height={24}
                        className="object-contain rounded-full"
                      />
                    ) : LucideIconComponent ? (
                      <LucideIconComponent className="w-5 h-5" />
                    ) : (
                      <ExternalLink className="w-5 h-5" />
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[var(--theme-text-primary)] truncate">
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* ChevronRight Icon */}
                <ChevronRight className="w-4 h-4 text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-accent-color,var(--theme-text-primary))] transition-colors shrink-0" />
              </a>
            )
          })}
      </div>
    </ThemedCard>
  )
}
