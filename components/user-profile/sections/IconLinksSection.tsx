import type { BaseSectionProps, IconLinksData } from '@/types/profile-sections'
import { ExternalLink } from 'lucide-react'
import { LUCIDE_ICON_MAP } from '@/lib/lucide-icons'
import Image from 'next/image'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'

/**
 * アイコンリンクセクション
 * SNS・連絡先のコンパクト表示（アイコンのみ、横並び）
 */
export function IconLinksSection({ section, isEditable: _isEditable }: BaseSectionProps) {
  const data = section.data as IconLinksData

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

      <div className="flex flex-wrap gap-3">
        {data.items
          .toSorted((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => {
            const LucideIconComponent =
              item.iconType === 'lucide' && item.lucideIconName
                ? (LUCIDE_ICON_MAP[item.lucideIconName] ?? null)
                : null

            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={item.platform}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--theme-card-bg)] text-[var(--theme-text-secondary)] hover:text-[var(--theme-accent-color,var(--theme-text-primary))] hover:scale-110 transition-all duration-300 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.7)]"
                style={{
                  boxShadow: 'var(--theme-card-shadow)',
                }}
              >
                {item.iconType === 'custom' && item.customIconUrl ? (
                  <Image
                    src={item.customIconUrl}
                    alt={item.platform}
                    width={24}
                    height={24}
                    className="object-contain"
                  />
                ) : LucideIconComponent ? (
                  <LucideIconComponent className="w-5 h-5" />
                ) : (
                  <ExternalLink className="w-5 h-5" />
                )}
              </a>
            )
          })}
      </div>
    </ThemedCard>
  )
}
