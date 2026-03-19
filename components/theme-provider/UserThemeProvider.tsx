'use client'

import {
  createContext,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react'
import { getTheme, DEFAULT_THEME_ID } from '@/lib/themes/registry'
import { migrateLegacyThemeId } from '@/lib/themes/compat'
import type { ThemePreset, ThemeDecorations } from '@/lib/themes/types'
import type { ThemeSettings } from '@/types/profile-sections'
import type React from 'react'

/**
 * 新しいテーマコンテキスト値
 */
export interface UserThemeContextValue {
  /** 現在のテーマプリセット */
  theme: ThemePreset
  /** テーマ設定（ユーザーカスタマイズ） */
  themeSettings: ThemeSettings
  /** 計算済みCSS変数 */
  themeVariables: React.CSSProperties
  /** 装飾タイプを取得 */
  getDecoration: <K extends keyof ThemeDecorations>(type: K) => ThemeDecorations[K]

  // 後方互換性のために残す
  /** @deprecated theme.idを使用してください */
  themePreset: string
}

export const UserThemeContext = createContext<UserThemeContextValue | null>(null)

interface UserThemeProviderProps {
  /** テーマID（新形式: "claymorphic-warm" / 旧形式: "claymorphic"） */
  themePreset: string
  /** テーマ設定 */
  themeSettings: ThemeSettings
  children: ReactNode
}

/**
 * ユーザープロフィールのテーマProvider
 * 新テーマシステムと旧テーマシステムの両方に対応
 * CSS変数をインラインスタイルで適用 + Tailwindクラスで参照可能
 */
export function UserThemeProvider({
  themePreset,
  themeSettings,
  children,
}: UserThemeProviderProps) {
  // 旧テーマIDを新テーマIDにマッピング
  const themeId = useMemo(() => migrateLegacyThemeId(themePreset), [themePreset])

  // テーマを取得（見つからない場合はデフォルト）
  const theme = useMemo(() => {
    return getTheme(themeId) ?? getTheme(DEFAULT_THEME_ID)!
  }, [themeId])

  // CSS変数を計算
  const themeVariables = useMemo(() => {
    const baseVariables = { ...theme.variables }

    // アクセントカラーのカスタマイズ
    if (themeSettings.accentColor) {
      baseVariables['--theme-text-accent'] = themeSettings.accentColor
      baseVariables['--theme-accent-bg'] = `${themeSettings.accentColor}14`
      baseVariables['--theme-accent-border'] = `${themeSettings.accentColor}33`
    }

    // ヘッダーカラーのカスタマイズ
    if (themeSettings.headerColor) {
      baseVariables['--theme-header-bg'] = themeSettings.headerColor
    }
    if (themeSettings.headerTextColor) {
      baseVariables['--theme-header-text'] = themeSettings.headerTextColor
    }

    // カスタムオーバーライド
    if (themeSettings.customOverrides) {
      Object.assign(baseVariables, themeSettings.customOverrides)
    }

    return baseVariables as React.CSSProperties
  }, [
    theme,
    themeSettings.accentColor,
    themeSettings.headerColor,
    themeSettings.headerTextColor,
    themeSettings.customOverrides,
  ])

  // 装飾タイプを取得するヘルパー
  // useCallbackでメモ化することで、themeが変わったときのみ新しい参照を作成
  const getDecoration = useCallback(
    <K extends keyof ThemeDecorations>(type: K): ThemeDecorations[K] => {
      return theme.decorations[type]
    },
    [theme]
  )

  const contextValue = useMemo<UserThemeContextValue>(
    () => ({
      theme,
      themeSettings,
      themeVariables,
      getDecoration,
      // 後方互換性
      themePreset: theme.id,
    }),
    [theme, themeSettings, themeVariables, getDecoration]
  )

  return (
    <UserThemeContext.Provider value={contextValue}>
      <div
        style={{
          ...themeVariables,
          fontFamily: 'var(--theme-font-family, var(--font-inter))',
        }}
        className="min-h-screen"
      >
        {children}
      </div>
    </UserThemeContext.Provider>
  )
}

