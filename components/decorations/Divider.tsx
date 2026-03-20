'use client'

import { cn } from '@/lib/utils'
import { useUserTheme } from '@/components/theme-provider/useUserTheme'
import type { DividerType } from '@/types/theme'

interface DividerProps {
  className?: string
}

/**
 * 区切り線スタイル定義（静的）
 */
const DIVIDER_STYLES: Record<Exclude<DividerType, 'none' | 'dots'>, string> = {
  line: 'h-px bg-theme-bar-bg',
  gradient:
    'h-px bg-gradient-to-r from-transparent via-theme-accent to-transparent',
  wave: 'h-4 bg-theme-bar-bg opacity-50',
}

/**
 * ドット用の配列（静的）
 */
const DOT_ARRAY = [0, 1, 2] as const

/**
 * テーマ対応区切り線コンポーネント
 * decorations.dividerの設定に応じてスタイルが変化
 */
export function Divider({ className }: DividerProps) {
  const { getDecoration } = useUserTheme()
  const dividerType = getDecoration('divider')

  if (dividerType === 'none') {
    return <div className={cn('h-4', className)} />
  }

  if (dividerType === 'dots') {
    return (
      <div className={cn('flex justify-center gap-2 py-2', className)}>
        {DOT_ARRAY.map((i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-theme-bar-bg" />
        ))}
      </div>
    )
  }

  return <div className={cn(DIVIDER_STYLES[dividerType], className)} />
}
