import type { ReactNode } from 'react'
import type {
  SectionSettings,
  SectionBackgroundPreset,
  SectionPaddingSize,
  ResponsivePadding,
} from '@/types/profile-sections'
import { resolveBackgroundStyle } from '@/lib/sections/background-utils'
import { cn } from '@/lib/utils'

// パディングクラスマッピング（方向別 × ブレークポイント別）
const PT: Record<SectionPaddingSize, string> = {
  none: 'pt-0', sm: 'pt-2', md: 'pt-4', lg: 'pt-8', xl: 'pt-12',
}
const PB: Record<SectionPaddingSize, string> = {
  none: 'pb-0', sm: 'pb-2', md: 'pb-4', lg: 'pb-8', xl: 'pb-12',
}
const MD_PT: Record<SectionPaddingSize, string> = {
  none: 'md:pt-0', sm: 'md:pt-2', md: 'md:pt-4', lg: 'md:pt-8', xl: 'md:pt-12',
}
const MD_PB: Record<SectionPaddingSize, string> = {
  none: 'md:pb-0', sm: 'md:pb-2', md: 'md:pb-4', lg: 'md:pb-8', xl: 'md:pb-12',
}
const LG_PT: Record<SectionPaddingSize, string> = {
  none: 'lg:pt-0', sm: 'lg:pt-2', md: 'lg:pt-4', lg: 'lg:pt-8', xl: 'lg:pt-12',
}
const LG_PB: Record<SectionPaddingSize, string> = {
  none: 'lg:pb-0', sm: 'lg:pb-2', md: 'lg:pb-4', lg: 'lg:pb-8', xl: 'lg:pb-12',
}

const DEFAULT_PADDING: ResponsivePadding = { mobile: 'sm', desktop: 'md' }

/**
 * レスポンシブパディングクラスを解決
 */
function resolveResponsivePadding(
  padding: ResponsivePadding | undefined,
  direction: 'top' | 'bottom',
): string {
  const p = padding ?? DEFAULT_PADDING
  const mobile = p.mobile
  const tablet = p.tablet ?? mobile    // 省略時: mobile 継承
  const desktop = p.desktop ?? tablet  // 省略時: tablet 継承

  if (direction === 'top') {
    return `${PT[mobile]} ${MD_PT[tablet]} ${LG_PT[desktop]}`
  }
  return `${PB[mobile]} ${MD_PB[tablet]} ${LG_PB[desktop]}`
}

interface SectionBandProps {
  settings: SectionSettings | null
  preset?: SectionBackgroundPreset | null
  children: ReactNode
  fullBleed?: boolean
}

/**
 * フルブリードの帯コンポーネント
 * 背景・パディングを管理し、各セクションをラップする
 */
export function SectionBand({
  settings,
  preset,
  children,
  fullBleed,
}: SectionBandProps) {
  const ptClass = resolveResponsivePadding(settings?.paddingTop, 'top')
  const pbClass = resolveResponsivePadding(settings?.paddingBottom, 'bottom')
  const bgStyle = resolveBackgroundStyle(preset)

  return (
    <div
      className={cn('relative w-full', ptClass, pbClass)}
      style={{
        ...bgStyle,
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
