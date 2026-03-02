/**
 * Tactical テーマプリセット
 * サイバーパンク × ミリタリーテックのダークテーマ
 * バリエーション: Dark
 */

import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'
import { DEFAULT_DECORATIONS } from '../types'

/**
 * Tactical ベース装飾設定
 */
const tacticalDecorations: ThemeDecorations = {
  ...DEFAULT_DECORATIONS,
  cardHover: 'lift',
  divider: 'line',
}

/**
 * Dark カラーパレット
 */
const darkPalette: ThemeColorPalette = {
  name: 'dark',
  displayName: 'ダーク',
  primary: '#00c2c7',
  secondary: '#0b8b9e',
  accent: '#00c2c7',
  background: '#0e0e11',
  cardBackground: '#18181b',
  text: {
    primary: '#cbd5e1',
    secondary: '#71717a',
    accent: '#00c2c7',
  },
}

/**
 * CSS変数を生成（純粋関数）
 * @param palette カラーパレット
 * @returns CSS変数のキーバリューペア
 */
function generateTacticalVariables(palette: ThemeColorPalette): Record<string, string> {
  return {
    '--theme-bg': palette.background,
    '--theme-card-bg': palette.cardBackground,
    '--theme-card-shadow':
      '0 0 0 1px rgba(22,78,99,0.3), inset 0 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.5)',
    '--theme-card-border': '1px solid #27272a',
    '--theme-card-radius': '4px',
    '--theme-text-primary': palette.text.primary,
    '--theme-text-secondary': palette.text.secondary,
    '--theme-text-accent': palette.text.accent,
    '--theme-accent-bg': `${palette.accent}14`,
    '--theme-accent-border': 'rgba(22,78,99,0.3)',
    '--theme-stat-bg': '#111113',
    '--theme-stat-border': '1px solid #27272a',
    '--theme-stat-shadow': 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05)',
    '--theme-bar-bg': '#27272a',
    '--theme-image-bg': `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
    '--theme-header-bg': palette.cardBackground,
    '--theme-header-text': '#e4e4e7',
    '--theme-header-shadow': '0 4px 12px rgba(0,0,0,0.5)',
  }
}

/**
 * Tactical Dark
 */
export const tacticalDark: ThemePreset = {
  id: 'tactical-dark',
  name: 'Tactical',
  colorVariant: 'dark',
  displayName: 'Tactical - ダーク',
  description: 'サイバーパンク × ミリタリーテックのダークテーマ。シアンアクセント。',
  base: 'flat',
  palette: darkPalette,
  decorations: tacticalDecorations,
  variables: generateTacticalVariables(darkPalette),
}

/**
 * 全Tacticalテーマをエクスポート
 */
export const tacticalThemes: ThemePreset[] = [tacticalDark]
