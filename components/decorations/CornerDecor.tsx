'use client'

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/UserThemeProvider'
import { Star, Heart, Ribbon } from 'lucide-react'
import type { CornerDecorType } from '@/types/theme'

interface CornerDecorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}

/**
 * 位置スタイル定義（静的）
 */
const POSITION_STYLES = {
  'top-left': 'top-0 left-0 -translate-x-1/4 -translate-y-1/4',
  'top-right': 'top-0 right-0 translate-x-1/4 -translate-y-1/4',
  'bottom-left': 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
  'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
} as const

/**
 * アイコン定義（静的）
 */
const ICONS: Record<Exclude<CornerDecorType, 'none'>, React.ReactNode> = {
  ribbon: <Ribbon className="w-6 h-6 text-theme-accent" />,
  star: <Star className="w-6 h-6 text-theme-accent fill-theme-accent" />,
  heart: <Heart className="w-6 h-6 text-theme-accent fill-theme-accent" />,
}

/**
 * テーマ対応コーナー装飾コンポーネント
 * decorations.cornerDecorの設定に応じてアイコンが変化
 */
export function CornerDecor({
  position = 'top-right',
  className,
}: CornerDecorProps) {
  const { getDecoration } = useUserTheme()
  const decorType = getDecoration('cornerDecor')

  if (decorType === 'none') {
    return null
  }

  return (
    <span
      className={cn('absolute z-10', POSITION_STYLES[position], className)}
    >
      {ICONS[decorType]}
    </span>
  )
}
