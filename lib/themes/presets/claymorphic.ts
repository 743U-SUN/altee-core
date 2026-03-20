/**
 * Claymorphic テーマプリセット
 * 柔らかな粘土質感のニューモーフィズム
 * バリエーション: Warm / Cool / Dark
 */

import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'
import { DEFAULT_DECORATIONS } from '../types'

/**
 * 色を明るく/暗くする簡易ユーティリティ（純粋関数）
 * @param hex HEXカラー（例: "#e8e4df"）
 * @param percent 正で明るく、負で暗く（-100〜100）
 * @returns 調整されたHEXカラー
 */
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`
}

/**
 * Claymorphic ベース装飾設定
 */
const claymorphicDecorations: ThemeDecorations = {
  ...DEFAULT_DECORATIONS,
  iconContainer: 'circle',
  cardHover: 'press',
}

/**
 * Warm カラーパレット
 */
const warmPalette: ThemeColorPalette = {
  name: 'warm',
  displayName: 'ウォーム',
  primary: '#b07d4f',
  secondary: '#c9a87c',
  accent: '#b07d4f',
  background: '#e8e4df',
  cardBackground: '#e8e4df',
  text: {
    primary: '#3d3a36',
    secondary: '#7a756e',
    accent: '#b07d4f',
  },
}

/**
 * Cool カラーパレット
 */
const coolPalette: ThemeColorPalette = {
  name: 'cool',
  displayName: 'クール',
  primary: '#5b7a9d',
  secondary: '#8ba3be',
  accent: '#5b7a9d',
  background: '#e4e8ec',
  cardBackground: '#e4e8ec',
  text: {
    primary: '#2d3a47',
    secondary: '#6b7d8f',
    accent: '#5b7a9d',
  },
}

/**
 * Dark カラーパレット
 */
const darkPalette: ThemeColorPalette = {
  name: 'dark',
  displayName: 'ダーク',
  primary: '#a78bfa',
  secondary: '#c4b5fd',
  accent: '#a78bfa',
  background: '#1f1f23',
  cardBackground: '#2d2d33',
  text: {
    primary: '#e4e4e7',
    secondary: '#a1a1aa',
    accent: '#a78bfa',
  },
}

/**
 * CSS変数を生成
 */
function generateClaymorphicVariables(palette: ThemeColorPalette): Record<string, string> {
  const isDark = palette.name === 'dark'

  return {
    '--theme-bg': palette.background,
    '--theme-card-bg': palette.cardBackground,
    '--theme-card-shadow': isDark
      ? '4px 4px 8px #151518, -3px -2px 8px #393942, inset 2px 2px 3px rgba(255,255,255,0.05)'
      : `4px 4px 8px ${adjustColor(palette.background, -15)}, -3px -2px 8px #ffffff, inset 2px 2px 3px rgba(255,255,255,0.6)`,
    '--theme-card-border': 'none',
    '--theme-card-radius': '16px',
    '--theme-text-primary': palette.text.primary,
    '--theme-text-secondary': palette.text.secondary,
    '--theme-text-accent': palette.text.accent,
    '--theme-accent-bg': `${palette.accent}14`,
    '--theme-accent-border': `${palette.accent}33`,
    '--theme-stat-bg': isDark ? '#252529' : adjustColor(palette.background, -5),
    '--theme-stat-border': 'none',
    '--theme-stat-shadow': isDark
      ? '4px 4px 8px #151518, -4px -4px 8px #353540, inset 1px 1px 2px rgba(255,255,255,0.03)'
      : `4px 4px 8px ${adjustColor(palette.background, -15)}, -4px -4px 8px #ffffff, inset 1px 1px 2px rgba(255,255,255,0.5)`,
    '--theme-bar-bg': isDark ? '#3a3a42' : adjustColor(palette.background, -8),
    '--theme-image-bg': `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 50%, ${palette.background} 100%)`,
    '--theme-header-bg': palette.cardBackground,
    '--theme-header-text': palette.text.primary,
    '--theme-header-shadow': isDark
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  }
}

/**
 * Claymorphic Warm
 */
export const claymorphicWarm: ThemePreset = {
  id: 'claymorphic-warm',
  name: 'Claymorphic',
  colorVariant: 'warm',
  displayName: 'Claymorphic - ウォーム',
  description: '柔らかな粘土質感のニューモーフィズム。暖色系。',
  base: 'neumorphic',
  palette: warmPalette,
  decorations: claymorphicDecorations,
  variables: generateClaymorphicVariables(warmPalette),
}

/**
 * Claymorphic Cool
 */
export const claymorphicCool: ThemePreset = {
  id: 'claymorphic-cool',
  name: 'Claymorphic',
  colorVariant: 'cool',
  displayName: 'Claymorphic - クール',
  description: '柔らかな粘土質感のニューモーフィズム。寒色系。',
  base: 'neumorphic',
  palette: coolPalette,
  decorations: claymorphicDecorations,
  variables: generateClaymorphicVariables(coolPalette),
}

/**
 * Claymorphic Dark
 */
export const claymorphicDark: ThemePreset = {
  id: 'claymorphic-dark',
  name: 'Claymorphic',
  colorVariant: 'dark',
  displayName: 'Claymorphic - ダーク',
  description: '柔らかな粘土質感のニューモーフィズム。ダークモード。',
  base: 'neumorphic',
  palette: darkPalette,
  decorations: claymorphicDecorations,
  variables: generateClaymorphicVariables(darkPalette),
}

/**
 * 全Claymorphicテーマをエクスポート
 */
export const claymorphicThemes: ThemePreset[] = [
  claymorphicWarm,
  claymorphicCool,
  claymorphicDark,
]
