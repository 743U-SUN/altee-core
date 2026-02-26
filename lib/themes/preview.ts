/**
 * テーマプレビュー機能
 * CSS変数を一時的に上書きしてテーマをプレビュー
 */

import { getTheme } from './registry'

/**
 * テーマプレビューを適用
 * @param themeId - プレビューするテーマのID
 * @returns クリーンアップ関数（プレビュー解除時に呼び出す）
 *
 * @remarks
 * - SSR環境では何もせずに空のクリーンアップ関数を返します
 * - テーマが見つからない場合はエラーログを出力し、空のクリーンアップ関数を返します
 * - クリーンアップ関数を呼び出すと、適用前の状態に戻ります
 */
export function applyThemePreview(themeId: string): () => void {
  // SSR対応: ブラウザ環境でのみ実行
  if (typeof window === 'undefined') {
    return () => {}
  }

  const theme = getTheme(themeId)
  if (!theme) {
    console.error(`[applyThemePreview] Theme not found: ${themeId}`)
    return () => {}
  }

  const root = document.documentElement
  if (!root) {
    console.error('[applyThemePreview] document.documentElement is null')
    return () => {}
  }

  const originalStyles: Record<string, string> = {}

  // CSS変数を一時的に上書き
  Object.entries(theme.variables).forEach(([key, value]) => {
    // 元の値を保存
    originalStyles[key] = root.style.getPropertyValue(key)
    // 新しい値を適用
    root.style.setProperty(key, value)
  })

  // クリーンアップ関数を返す
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
 * 複数のCSS変数を一括でプレビュー
 * @param variables - CSS変数のオブジェクト
 * @returns クリーンアップ関数
 *
 * @remarks
 * - SSR環境では何もせずに空のクリーンアップ関数を返します
 * - クリーンアップ関数を呼び出すと、適用前の状態に戻ります
 */
export function applyVariablesPreview(
  variables: Record<string, string>
): () => void {
  // SSR対応: ブラウザ環境でのみ実行
  if (typeof window === 'undefined') {
    return () => {}
  }

  const root = document.documentElement
  if (!root) {
    console.error('[applyVariablesPreview] document.documentElement is null')
    return () => {}
  }

  const originalStyles: Record<string, string> = {}

  Object.entries(variables).forEach(([key, value]) => {
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
