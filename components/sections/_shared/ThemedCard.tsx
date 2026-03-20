'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/useUserTheme'
import { CornerDecor } from '@/components/decorations'
import { HOVER_CLASSES } from '@/lib/sections/constants'

interface ThemedCardProps {
  children: ReactNode
  className?: string
  showCornerDecor?: boolean
  cornerPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size?: 'sm' | 'md' | 'lg'
  hover?: boolean
}

const SIZE_CLASSES = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const

/**
 * テーマ対応カードコンポーネント（Phase 2拡張版）
 * - CSS変数によるテーマスタイリング
 * - オプションの装飾（CornerDecor）
 * - テーマ連動のhoverエフェクト
 */
export function ThemedCard({
  children,
  className = '',
  showCornerDecor = false,
  cornerPosition = 'top-right',
  size = 'md',
  hover = false,
}: ThemedCardProps) {
  const { getDecoration } = useUserTheme()
  const hoverEffect = getDecoration('cardHover')

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-theme-card-bg rounded-theme shadow-theme',
        SIZE_CLASSES[size],
        hover && HOVER_CLASSES[hoverEffect],
        className
      )}
      style={{
        // Tailwind v4でサポートされないプロパティはstyleで
        border: 'var(--theme-card-border, none)',
      }}
    >
      {showCornerDecor && <CornerDecor position={cornerPosition} />}
      {children}
    </div>
  )
}
