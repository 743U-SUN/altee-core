import type { BaseSectionProps, LinksData } from '@/types/profile-sections'
import { ExternalLink } from 'lucide-react'
import { LUCIDE_ICON_MAP } from '@/lib/lucide-icons'
import Image from 'next/image'
import { ThemedCard } from '@/components/sections/_shared/ThemedCard'
import { Badge } from '@/components/decorations'

/**
 * リンクセクション
 * SNS・Webサイトリンクを表示
 */
export function LinksSection({ section, isEditable }: BaseSectionProps) {
  const data = section.data as LinksData

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.items
          .toSorted((a, b) => a.sortOrder - b.sortOrder)
          .map((link) => {
            const LucideIconComponent =
              link.iconType === 'lucide' && link.lucideIconName
                ? (LUCIDE_ICON_MAP[link.lucideIconName] ?? null)
                : null

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  group flex items-center gap-4 p-4
                  rounded-lg
                  hover:bg-theme-bar-bg/50 transition-all duration-300
                "
              >
                {/* Icon - 円形コンテナ */}
                <div
                  className="
                    w-10 h-10 shrink-0 flex items-center justify-center
                    rounded-full bg-theme-bar-bg
                    text-[var(--theme-accent-color,var(--theme-text-secondary))]
                  "
                >
                  {link.iconType === 'custom' && link.customIconUrl ? (
                    <Image
                      src={link.customIconUrl}
                      alt={link.title}
                      width={24}
                      height={24}
                      className="object-contain rounded-full"
                    />
                  ) : link.iconType === 'preset' && link.iconKey ? (
                    <Image
                      src={`/api/link-icons/${link.iconKey}`}
                      alt={link.title}
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

                {/* Title, Description & URL */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[var(--theme-text-primary)] truncate">
                    {link.title}
                  </p>
                  {link.description && (
                    <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 truncate">
                      {link.description}
                    </p>
                  )}
                  <p className="text-xs text-[var(--theme-text-secondary)] mt-0.5 truncate">
                    {link.url}
                  </p>
                </div>

                {/* External Link Icon */}
                <ExternalLink className="w-4 h-4 text-[var(--theme-text-secondary)] group-hover:text-[var(--theme-accent-color,var(--theme-text-primary))] transition-colors shrink-0" />
              </a>
            )
          })}
      </div>
    </ThemedCard>
  )
}
