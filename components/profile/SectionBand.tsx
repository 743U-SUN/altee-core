import type { ReactNode } from 'react'
import type {
  SectionSettings,
  SectionBackgroundPreset,
} from '@/types/profile-sections'
import { resolveBackgroundStyle } from '@/lib/sections/background-utils'
import { buildPaddingCssVars } from '@/lib/sections/padding-utils'
import { cn } from '@/lib/utils'

interface SectionBandProps {
  settings: SectionSettings | null
  preset?: SectionBackgroundPreset | null
  children: ReactNode
  fullBleed?: boolean
}

/**
 * フルブリードの帯コンポーネント
 * 背景・パディングを管理し、各セクションをラップする
 *
 * パディングは CSS Custom Properties で設定し、
 * globals.css のメディアクエリでレスポンシブ対応する
 */
export function SectionBand({
  settings,
  preset,
  children,
  fullBleed,
}: SectionBandProps) {
  const bgStyle = resolveBackgroundStyle(preset)
  const paddingVars = buildPaddingCssVars(
    settings?.paddingTop,
    settings?.paddingBottom,
  )

  return (
    <div
      data-section-band=""
      className={cn('relative w-full')}
      style={{
        ...bgStyle,
        ...paddingVars,
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 200px',
      }}
    >
      {fullBleed ? (
        children
      ) : (
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {children}
        </div>
      )}
    </div>
  )
}
