/**
 * Pastel Dream テーマプリセット
 * 柔らかなパステルカラーのかわいいデザイン
 * バリエーション: Pink / Mint / Blue
 */

import type { ThemePreset, ThemeColorPalette, ThemeDecorations } from '../types'
import { DEFAULT_DECORATIONS } from '../types'

/**
 * Pastel Dream ベース装飾設定
 */
const pastelDecorations: ThemeDecorations = {
  ...DEFAULT_DECORATIONS,
  divider: 'dots',
  iconContainer: 'circle',
  cardHover: 'glow',
  cornerDecor: 'heart',
}

/**
 * Pink カラーパレット
 */
const pinkPalette: ThemeColorPalette = {
  name: 'pink',
  displayName: 'ピンク',
  primary: '#ec4899',
  secondary: '#f472b6',
  accent: '#ec4899',
  background: '#fdf2f8',
  cardBackground: '#ffffff',
  text: {
    primary: '#831843',
    secondary: '#9d174d',
    accent: '#ec4899',
  },
}

/**
 * Mint カラーパレット
 */
const mintPalette: ThemeColorPalette = {
  name: 'mint',
  displayName: 'ミント',
  primary: '#10b981',
  secondary: '#34d399',
  accent: '#10b981',
  background: '#ecfdf5',
  cardBackground: '#ffffff',
  text: {
    primary: '#065f46',
    secondary: '#047857',
    accent: '#10b981',
  },
}

/**
 * Blue カラーパレット
 */
const bluePalette: ThemeColorPalette = {
  name: 'blue',
  displayName: 'ブルー',
  primary: '#3b82f6',
  secondary: '#60a5fa',
  accent: '#3b82f6',
  background: '#eff6ff',
  cardBackground: '#ffffff',
  text: {
    primary: '#1e40af',
    secondary: '#1d4ed8',
    accent: '#3b82f6',
  },
}

/**
 * CSS変数を生成（純粋関数）
 * @param palette カラーパレット
 * @returns CSS変数のキーバリューペア
 */
function generatePastelVariables(palette: ThemeColorPalette): Record<string, string> {
  return {
    '--theme-bg': palette.background,
    '--theme-card-bg': palette.cardBackground,
    '--theme-card-shadow': `0 4px 12px ${palette.primary}15, 0 2px 4px ${palette.primary}10`,
    '--theme-card-border': `1px solid ${palette.primary}20`,
    '--theme-card-radius': '20px',
    '--theme-text-primary': palette.text.primary,
    '--theme-text-secondary': palette.text.secondary,
    '--theme-text-accent': palette.text.accent,
    '--theme-accent-bg': `${palette.accent}15`,
    '--theme-accent-border': `${palette.accent}30`,
    '--theme-stat-bg': palette.background,
    '--theme-stat-border': `1px solid ${palette.primary}20`,
    '--theme-stat-shadow': `inset 0 2px 4px ${palette.primary}10`,
    '--theme-bar-bg': `${palette.primary}20`,
    '--theme-image-bg': `linear-gradient(135deg, ${palette.primary}30 0%, ${palette.secondary}30 50%, ${palette.background} 100%)`,
    '--theme-header-bg': palette.cardBackground,
    '--theme-header-text': palette.text.primary,
    '--theme-header-shadow': `0 2px 8px ${palette.primary}10`,
  }
}

/**
 * Pastel Dream Pink
 */
export const pastelPink: ThemePreset = {
  id: 'pastel-dream-pink',
  name: 'Pastel Dream',
  colorVariant: 'pink',
  displayName: 'Pastel Dream - ピンク',
  description: '柔らかなパステルカラーのかわいいデザイン。ピンク基調。',
  base: 'flat',
  palette: pinkPalette,
  decorations: pastelDecorations,
  variables: generatePastelVariables(pinkPalette),
}

/**
 * Pastel Dream Mint
 */
export const pastelMint: ThemePreset = {
  id: 'pastel-dream-mint',
  name: 'Pastel Dream',
  colorVariant: 'mint',
  displayName: 'Pastel Dream - ミント',
  description: '柔らかなパステルカラーのかわいいデザイン。ミント基調。',
  base: 'flat',
  palette: mintPalette,
  decorations: pastelDecorations,
  variables: generatePastelVariables(mintPalette),
}

/**
 * Pastel Dream Blue
 */
export const pastelBlue: ThemePreset = {
  id: 'pastel-dream-blue',
  name: 'Pastel Dream',
  colorVariant: 'blue',
  displayName: 'Pastel Dream - ブルー',
  description: '柔らかなパステルカラーのかわいいデザイン。ブルー基調。',
  base: 'flat',
  palette: bluePalette,
  decorations: pastelDecorations,
  variables: generatePastelVariables(bluePalette),
}

/**
 * 全Pastel Dreamテーマをエクスポート
 */
export const pastelDreamThemes: ThemePreset[] = [
  pastelPink,
  pastelMint,
  pastelBlue,
]
