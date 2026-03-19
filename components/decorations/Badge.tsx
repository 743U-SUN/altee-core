'use client'

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/useUserTheme'
import type { BadgeType } from '@/types/theme'

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'accent'
}

/**
 * バッジスタイル定義（静的）
 */
const BADGE_STYLES: Record<Exclude<BadgeType, 'none'>, string> = {
  pill: 'rounded-full px-3 py-1',
  ribbon:
    'relative pl-4 pr-2 py-1 before:absolute before:left-0 before:top-0 before:h-full before:w-2 before:bg-theme-accent',
  tag: 'rounded-sm px-2 py-0.5 border border-theme-accent-border',
  star: 'relative px-4 py-1',
}

/**
 * バリアントスタイル定義（静的）
 */
const VARIANT_STYLES = {
  default: 'bg-theme-stat-bg text-theme-secondary',
  accent: 'bg-theme-accent-bg text-theme-accent',
} as const

/**
 * テーマ対応バッジコンポーネント
 * decorations.badgeの設定に応じてスタイルが変化
 */
export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const { getDecoration } = useUserTheme()
  const badgeType = getDecoration('badge')

  if (badgeType === 'none') {
    return <span className={className}>{children}</span>
  }

  return (
    <span
      className={cn(
        'inline-flex items-center text-sm font-medium',
        BADGE_STYLES[badgeType],
        VARIANT_STYLES[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
