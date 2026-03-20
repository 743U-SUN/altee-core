'use client'

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/useUserTheme'
import type { IconContainerType } from '@/types/theme'

interface IconContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * サイズスタイル定義（静的）
 */
const SIZE_STYLES = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
} as const

/**
 * コンテナスタイル定義（静的）
 */
const CONTAINER_STYLES: Record<Exclude<IconContainerType, 'none'>, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
  square: 'rounded-none',
  hexagon: 'clip-path-hexagon rounded-lg', // hexagonはclip-pathで実装
}

/**
 * テーマ対応アイコンコンテナコンポーネント
 * decorations.iconContainerの設定に応じてスタイルが変化
 */
export function IconContainer({
  children,
  className,
  size = 'md',
}: IconContainerProps) {
  const { getDecoration } = useUserTheme()
  const containerType = getDecoration('iconContainer')

  if (containerType === 'none') {
    return <span className={className}>{children}</span>
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'bg-theme-stat-bg shadow-theme-stat',
        SIZE_STYLES[size],
        CONTAINER_STYLES[containerType],
        className
      )}
    >
      {children}
    </span>
  )
}
