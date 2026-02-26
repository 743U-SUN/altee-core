/**
 * テーマシステム型定義
 * 3層アーキテクチャ: Base → Variant → Color
 */

/**
 * テーマベース（スタイルの基本形）
 */
export type ThemeBase = 'neumorphic' | 'flat' | 'glass' | 'card'

/**
 * セクションカテゴリ
 */
export type SectionCategory =
  | 'main'      // メインコンテンツ
  | 'image'     // 画像系
  | 'links'     // リンク系
  | 'content'   // テキストコンテンツ
  | 'data'      // データ表示
  | 'video'     // 動画系
  | 'structure' // 構造要素

/**
 * カラーバリアント
 */
export type ColorVariant = 'warm' | 'cool' | 'dark' | 'white' | 'gray' | 'black' | 'pink' | 'mint' | 'blue'

/**
 * カラーパレット
 */
export interface ThemeColorPalette {
  name: ColorVariant        // "warm", "cool", "dark"
  displayName: string       // "ウォーム", "クール", "ダーク"
  primary: string           // メインカラー
  secondary: string         // サブカラー
  accent: string            // アクセントカラー
  background: string        // 背景色
  cardBackground: string    // カード背景色
  text: {
    primary: string         // メインテキスト
    secondary: string       // サブテキスト
    accent: string          // アクセントテキスト
  }
}

/**
 * 装飾タイプ
 */
export type BadgeType = 'pill' | 'ribbon' | 'tag' | 'star' | 'none'
export type DividerType = 'line' | 'dots' | 'gradient' | 'wave' | 'none'
export type IconContainerType = 'circle' | 'rounded' | 'square' | 'hexagon' | 'none'
export type CardHoverType = 'lift' | 'glow' | 'press' | 'shake' | 'none'
export type CornerDecorType = 'ribbon' | 'star' | 'heart' | 'none'

/**
 * 装飾設定
 */
export interface ThemeDecorations {
  badge: BadgeType
  divider: DividerType
  iconContainer: IconContainerType
  cardHover: CardHoverType
  cornerDecor: CornerDecorType
}

/**
 * テーマプリセット
 */
export interface ThemePreset {
  id: string                              // "claymorphic-warm"
  name: string                            // "Claymorphic"
  colorVariant: ColorVariant              // "warm"
  displayName: string                     // "Claymorphic - ウォーム"
  description?: string                    // テーマの説明
  base: ThemeBase                         // "neumorphic"
  palette: ThemeColorPalette              // カラーパレット
  decorations: ThemeDecorations           // 装飾設定
  variables: Record<string, string>       // CSS変数
}

/**
 * テーマ設定（ユーザーカスタマイズ用）
 * 既存のThemeSettingsとは別に、新テーマシステム用の設定
 */
export interface NewThemeSettings {
  themeId: string                         // 選択されたテーマID
  accentColor?: string                    // カスタムアクセント色
  fontFamily?: string                     // フォント
  customOverrides?: Record<string, string> // カスタムオーバーライド
}

/**
 * テーマコンテキスト値
 */
export interface ThemeContextValue {
  theme: ThemePreset
  settings: NewThemeSettings
  variables: Record<string, string>
  getDecoration: <K extends keyof ThemeDecorations>(type: K) => ThemeDecorations[K]
}

/**
 * CSS変数のキー一覧（型安全のため）
 */
export const THEME_CSS_VARIABLES = [
  '--theme-bg',
  '--theme-card-bg',
  '--theme-card-shadow',
  '--theme-card-border',
  '--theme-card-radius',
  '--theme-text-primary',
  '--theme-text-secondary',
  '--theme-text-accent',
  '--theme-accent-bg',
  '--theme-accent-border',
  '--theme-stat-bg',
  '--theme-stat-border',
  '--theme-stat-shadow',
  '--theme-bar-bg',
  '--theme-image-bg',
  '--theme-header-bg',
  '--theme-header-text',
  '--theme-header-shadow',
] as const

export type ThemeCSSVariable = (typeof THEME_CSS_VARIABLES)[number]
