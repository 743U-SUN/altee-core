/**
 * テーマレジストリ
 * 全テーマプリセットの管理と取得
 */

import type { ThemePreset, ThemeBase } from './types'
import { claymorphicThemes, minimalThemes, pastelDreamThemes, tacticalThemes } from './presets'

/**
 * 全テーマプリセットのレジストリ
 */
const THEME_REGISTRY: Map<string, ThemePreset> = new Map()

/**
 * テーマを登録
 */
function registerThemes(themes: ThemePreset[]): void {
  themes.forEach((theme) => {
    THEME_REGISTRY.set(theme.id, theme)
  })
}

// 全テーマを登録
registerThemes(claymorphicThemes)
registerThemes(minimalThemes)
registerThemes(pastelDreamThemes)
registerThemes(tacticalThemes)

/**
 * テーマを取得
 */
export function getTheme(id: string): ThemePreset | undefined {
  return THEME_REGISTRY.get(id)
}

/**
 * 全テーマを取得
 */
export function getAllThemes(): ThemePreset[] {
  return Array.from(THEME_REGISTRY.values())
}

/**
 * テーマをベースでフィルタ
 */
export function getThemesByBase(base: ThemeBase): ThemePreset[] {
  return getAllThemes().filter((theme) => theme.base === base)
}

/**
 * テーマ名でグループ化（キャッシュ済み）
 * 起動時に一度だけ計算し、結果をキャッシュします
 */
const GROUPED_THEMES = (() => {
  const grouped: Record<string, ThemePreset[]> = {}

  getAllThemes().forEach((theme) => {
    if (!grouped[theme.name]) {
      grouped[theme.name] = []
    }
    grouped[theme.name].push(theme)
  })

  return grouped
})()

/**
 * テーマ名でグループ化
 * @returns グループ化されたテーマのキャッシュ済みオブジェクト
 */
export function getThemesGroupedByName(): Record<string, ThemePreset[]> {
  return GROUPED_THEMES
}

/**
 * デフォルトテーマID
 */
export const DEFAULT_THEME_ID = 'claymorphic-warm'

/**
 * テーマが存在するか確認
 */
export function hasTheme(id: string): boolean {
  return THEME_REGISTRY.has(id)
}

/**
 * テーマ数を取得
 */
export function getThemeCount(): number {
  return THEME_REGISTRY.size
}
