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
  getThemesByBase,
  getThemesGroupedByName,
  hasTheme,
  getThemeCount,
  DEFAULT_THEME_ID,
} from './registry'

// プリセット
export {
  // Claymorphic
  claymorphicThemes,
  claymorphicWarm,
  claymorphicCool,
  claymorphicDark,
  // Minimal
  minimalThemes,
  minimalWhite,
  minimalGray,
  minimalBlack,
  // Pastel Dream
  pastelDreamThemes,
  pastelPink,
  pastelMint,
  pastelBlue,
} from './presets'

// 互換性レイヤー
export { migrateLegacyThemeId, isLegacyThemeId } from './compat'

// プレビュー機能
export { applyThemePreview, applyVariablesPreview } from './preview'
