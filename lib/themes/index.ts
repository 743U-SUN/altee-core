/**
 * テーマシステム
 * エントリーポイント
 */

// 型定義
export type {
  ThemeBase,
  ColorVariant,
  SectionCategory,
  ThemeColorPalette,
  ThemeDecorations,
  BadgeType,
  DividerType,
  IconContainerType,
  CardHoverType,
  CornerDecorType,
  ThemePreset,
  NewThemeSettings,
  ThemeContextValue,
  ThemeCSSVariable,
} from './types'

export { THEME_CSS_VARIABLES } from './types'

// レジストリ
export {
  getTheme,
  getAllThemes,
  getThemesGroupedByName,
  hasTheme,
  DEFAULT_THEME_ID,
} from './registry'


// 互換性レイヤー
export { migrateLegacyThemeId, isLegacyThemeId } from './compat'

// プレビュー機能は 'use client' モジュール専用のため、バレルからは除外
// 使用箇所: import { applyThemePreview, applyVariablesPreview } from '@/lib/themes/preview'
