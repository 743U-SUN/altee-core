/**
 * Minimal テーマプリセット
 * シンプルで軽やかなフラットデザイン
 * バリエーション: White / Gray / Black
 */

import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'
import { DEFAULT_DECORATIONS } from '../types'

/**
 * Minimal ベース装飾設定
 */
const minimalDecorations: ThemeDecorations = {
  ...DEFAULT_DECORATIONS,
  badge: 'tag',
  divider: 'line',
}

/**
 * White カラーパレット
 */
const whitePalette: ThemeColorPalette = {
  name: 'white',
  displayName: 'ホワイト',
  primary: '#2563eb',
  secondary: '#3b82f6',
  accent: '#2563eb',
  background: '#ffffff',
  cardBackground: '#ffffff',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    accent: '#2563eb',
  },
}

/**
 * Gray カラーパレット
 */
const grayPalette: ThemeColorPalette = {
  name: 'gray',
  displayName: 'グレー',
  primary: '#4b5563',
  secondary: '#6b7280',
  accent: '#4b5563',
  background: '#f9fafb',
  cardBackground: '#ffffff',
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    accent: '#4b5563',
  },
}

/**
 * Black カラーパレット
 */
const blackPalette: ThemeColorPalette = {
  name: 'black',
  displayName: 'ブラック',
  primary: '#f9fafb',
  secondary: '#e5e7eb',
  accent: '#f9fafb',
  background: '#111827',
  cardBackground: '#1f2937',
  text: {
    primary: '#f9fafb',
    secondary: '#9ca3af',
    accent: '#f9fafb',
  },
}

/**
 * CSS変数を生成（純粋関数）
 * @param palette カラーパレット
 * @returns CSS変数のキーバリューペア
 */
function generateMinimalVariables(palette: ThemeColorPalette): Record<string, string> {
  const isDark = palette.name === 'black'

  return {
    '--theme-bg': palette.background,
    '--theme-card-bg': palette.cardBackground,
    '--theme-card-shadow': isDark
      ? '0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)'
      : '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    '--theme-card-border': isDark ? '1px solid #374151' : '1px solid #e5e7eb',
    '--theme-card-radius': '12px',
    '--theme-text-primary': palette.text.primary,
    '--theme-text-secondary': palette.text.secondary,
    '--theme-text-accent': palette.text.accent,
    '--theme-accent-bg': `${palette.accent}0f`,
    '--theme-accent-border': `${palette.accent}33`,
    '--theme-stat-bg': isDark ? '#374151' : '#f3f4f6',
    '--theme-stat-border': isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
    '--theme-stat-shadow': 'none',
    '--theme-bar-bg': isDark ? '#4b5563' : '#e5e7eb',
    '--theme-image-bg': isDark
      ? 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #111827 100%)'
      : 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #f0f9ff 100%)',
    '--theme-header-bg': palette.cardBackground,
    '--theme-header-text': palette.text.primary,
    '--theme-header-shadow': isDark
      ? '0 1px 2px rgba(0,0,0,0.2)'
      : '0 1px 2px rgba(0,0,0,0.05)',
  }
}

/**
 * Minimal White
 */
export const minimalWhite: ThemePreset = {
  id: 'minimal-white',
  name: 'Minimal',
  colorVariant: 'white',
  displayName: 'Minimal - ホワイト',
  description: 'シンプルで清潔感のあるフラットデザイン。白基調。',
  base: 'flat',
  palette: whitePalette,
  decorations: minimalDecorations,
  variables: generateMinimalVariables(whitePalette),
}

/**
 * Minimal Gray
 */
export const minimalGray: ThemePreset = {
  id: 'minimal-gray',
  name: 'Minimal',
  colorVariant: 'gray',
  displayName: 'Minimal - グレー',
  description: 'シンプルで清潔感のあるフラットデザイン。グレー基調。',
  base: 'flat',
  palette: grayPalette,
  decorations: minimalDecorations,
  variables: generateMinimalVariables(grayPalette),
}

/**
 * Minimal Black
 */
export const minimalBlack: ThemePreset = {
  id: 'minimal-black',
  name: 'Minimal',
  colorVariant: 'black',
  displayName: 'Minimal - ブラック',
  description: 'シンプルで清潔感のあるフラットデザイン。ダークモード。',
  base: 'flat',
  palette: blackPalette,
  decorations: minimalDecorations,
  variables: generateMinimalVariables(blackPalette),
}

/**
 * 全Minimalテーマをエクスポート
 */
export const minimalThemes: ThemePreset[] = [
  minimalWhite,
  minimalGray,
  minimalBlack,
]
