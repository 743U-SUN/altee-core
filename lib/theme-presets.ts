import type React from 'react'

/**
 * テーマプリセット定義
 */
export interface ThemePreset {
  name: string
  displayName: string
  variables: React.CSSProperties
}

/**
 * フォント名 → CSS変数名のマッピング
 */
export const FONT_VARIABLE_MAP: Record<string, string> = {
  'Inter': 'var(--font-inter)',
  'Noto Sans JP': 'var(--font-noto-sans-jp)',
  'M PLUS Rounded 1c': 'var(--font-m-plus-rounded)',
  'Zen Maru Gothic': 'var(--font-zen-maru)',
}

/**
 * 利用可能なフォントリスト
 */
export const AVAILABLE_FONTS = [
  { name: 'Inter', label: 'Inter（デフォルト）' },
  { name: 'Noto Sans JP', label: 'Noto Sans JP' },
  { name: 'M PLUS Rounded 1c', label: 'M PLUS Rounded 1c（丸ゴシック）' },
  { name: 'Zen Maru Gothic', label: 'Zen Maru Gothic（丸ゴシック）' },
]

/**
 * Claymorphic テーマプリセット
 * app/demo/claymorphic/page.tsx より抽出
 */
export const claymorphicPreset: ThemePreset = {
  name: 'claymorphic',
  displayName: 'Claymorphic',
  variables: {
    '--theme-bg': '#e8e4df',
    '--theme-card-bg': '#e8e4df',
    '--theme-card-shadow':
      '4px 4px 8px #c5c2bd, -3px -2px 8px #ffffff, inset 2px 2px 3px rgba(255,255,255,0.6)',
    '--theme-card-border': 'none',
    '--theme-card-radius': '16px',
    '--theme-text-primary': '#3d3a36',
    '--theme-text-secondary': '#7a756e',
    '--theme-text-accent': '#b07d4f',
    '--theme-accent-bg': 'rgba(176,125,79,0.12)',
    '--theme-accent-border': 'rgba(176,125,79,0.2)',
    '--theme-stat-bg': '#ddd9d4',
    '--theme-stat-border': 'none',
    '--theme-stat-shadow':
      '4px 4px 8px #c5c2bd, -4px -4px 8px #ffffff, inset 1px 1px 2px rgba(255,255,255,0.5)',
    '--theme-bar-bg': '#d5d1cc',
    '--theme-image-bg':
      'linear-gradient(135deg, #c9b99a 0%, #a89070 50%, #e8e4df 100%)',
    '--theme-header-bg': '#e8e4df',
    '--theme-header-text': '#3d3a36',
    '--theme-header-shadow':
      '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
  } as React.CSSProperties,
}

/**
 * Minimal テーマプリセット
 * シンプルで軽やかなデザイン（白基調、影を抑えた清潔感）
 */
export const minimalPreset: ThemePreset = {
  name: 'minimal',
  displayName: 'Minimal',
  variables: {
    '--theme-bg': '#f9fafb',
    '--theme-card-bg': '#ffffff',
    '--theme-card-shadow': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    '--theme-card-border': '1px solid #e5e7eb',
    '--theme-card-radius': '12px',
    '--theme-text-primary': '#111827',
    '--theme-text-secondary': '#6b7280',
    '--theme-text-accent': '#2563eb',
    '--theme-accent-bg': 'rgba(37,99,235,0.06)',
    '--theme-accent-border': 'rgba(37,99,235,0.2)',
    '--theme-stat-bg': '#f3f4f6',
    '--theme-stat-border': '1px solid #e5e7eb',
    '--theme-stat-shadow': 'none',
    '--theme-bar-bg': '#e5e7eb',
    '--theme-image-bg': 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #f0f9ff 100%)',
    '--theme-header-bg': '#ffffff',
    '--theme-header-text': '#111827',
    '--theme-header-shadow': '0 1px 2px rgba(0,0,0,0.05)',
  } as React.CSSProperties,
}

/**
 * テーマプリセットマップ
 */
export const THEME_PRESETS: Record<string, ThemePreset> = {
  claymorphic: claymorphicPreset,
  minimal: minimalPreset,
}

/**
 * テーマプリセットを取得
 */
export function getThemePreset(name: string): ThemePreset | undefined {
  return THEME_PRESETS[name]
}

/**
 * テーマ変数をCSSプロパティとして適用
 */
export function applyThemeVariables(
  presetName: string,
  options?: {
    fontFamily?: string
    headerColor?: string
    headerTextColor?: string
    accentColor?: string
    customOverrides?: Record<string, string>
  }
): React.CSSProperties {
  const preset = getThemePreset(presetName)
  if (!preset) {
    return {}
  }

  const overrides: Record<string, string> = {}

  if (options?.fontFamily) {
    const fontVar = FONT_VARIABLE_MAP[options.fontFamily]
    if (fontVar) {
      overrides['--theme-font-family'] = fontVar
    }
  }

  if (options?.headerColor && /^#[0-9a-fA-F]{3,8}$/.test(options.headerColor)) {
    overrides['--theme-header-bg'] = options.headerColor
  }

  if (options?.headerTextColor && /^#[0-9a-fA-F]{3,8}$/.test(options.headerTextColor)) {
    overrides['--theme-header-text'] = options.headerTextColor
  }

  if (options?.accentColor && /^#[0-9a-fA-F]{3,8}$/.test(options.accentColor)) {
    overrides['--theme-text-accent'] = options.accentColor
    overrides['--theme-accent-bg'] = `${options.accentColor}14`
    overrides['--theme-accent-border'] = `${options.accentColor}33`
  }

  return {
    ...preset.variables,
    ...overrides,
    ...options?.customOverrides,
  }
}

/**
 * 全てのテーマプリセットを取得
 */
export function getAllThemePresets(): ThemePreset[] {
  return Object.values(THEME_PRESETS)
}
