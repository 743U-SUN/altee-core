'use client'

/**
 * テーマプレビュー機能
 * CSS変数を一時的に上書きしてテーマをプレビュー
 */

import { getTheme } from './registry'

const CSS_VAR_PREFIX = '--theme-'

/**
 * CSS変数を適用し、クリーンアップ関数を返す共通処理
 */
function applyAndReturnCleanup(variables: Record<string, string>): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const root = document.documentElement
  if (!root) {
    return () => {}
  }

  const originalStyles: Record<string, string> = {}

  Object.entries(variables).forEach(([key, value]) => {
    if (!key.startsWith(CSS_VAR_PREFIX)) return
    originalStyles[key] = root.style.getPropertyValue(key)
    root.style.setProperty(key, value)
  })

  return () => {
    Object.entries(originalStyles).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value)
      } else {
        root.style.removeProperty(key)
      }
    })
  }
}

/**
 * テーマプレビューを適用
 * @returns クリーンアップ関数（プレビュー解除時に呼び出す）
 */
export function applyThemePreview(themeId: string): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const theme = getTheme(themeId)
  if (!theme) {
    return () => {}
  }

  return applyAndReturnCleanup(theme.variables)
}

/**
 * 複数のCSS変数を一括でプレビュー
 * @returns クリーンアップ関数
 */
export function applyVariablesPreview(
  variables: Record<string, string>
): () => void {
  return applyAndReturnCleanup(variables)
}
