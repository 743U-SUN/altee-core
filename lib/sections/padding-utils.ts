import type {
  SectionPaddingSize,
  SectionPaddingValue,
  ResponsivePadding,
} from '@/types/profile-sections'

/** プリセット名 → px値 の変換テーブル */
const PRESET_TO_PX: Record<SectionPaddingSize, number> = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 32,
  xl: 48,
}

/** SectionPaddingValue → px数値 */
export function paddingToPx(value: SectionPaddingValue): number {
  if (typeof value === 'number') return value
  return PRESET_TO_PX[value]
}

/** SectionPaddingValue → 'Npx' 文字列 */
function paddingToPxString(value: SectionPaddingValue): string {
  return `${paddingToPx(value)}px`
}

const DEFAULT_PADDING: ResponsivePadding = { mobile: 'sm', desktop: 'md' }

/**
 * ResponsivePadding → CSS custom properties オブジェクト
 * globals.css のメディアクエリと連携して、レスポンシブパディングを実現
 */
export function buildPaddingCssVars(
  paddingTop: ResponsivePadding | undefined,
  paddingBottom: ResponsivePadding | undefined,
): Record<string, string> {
  const pt = paddingTop ?? DEFAULT_PADDING
  const pb = paddingBottom ?? DEFAULT_PADDING

  const vars: Record<string, string> = {
    '--spt': paddingToPxString(pt.mobile),
    '--spb': paddingToPxString(pb.mobile),
  }

  if (pt.tablet !== undefined) {
    vars['--spt-md'] = paddingToPxString(pt.tablet)
  }
  if (pb.tablet !== undefined) {
    vars['--spb-md'] = paddingToPxString(pb.tablet)
  }

  if (pt.desktop !== undefined) {
    vars['--spt-lg'] = paddingToPxString(pt.desktop)
  }
  if (pb.desktop !== undefined) {
    vars['--spb-lg'] = paddingToPxString(pb.desktop)
  }

  return vars
}
