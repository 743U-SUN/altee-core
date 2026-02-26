import type { ReactNode } from 'react'
import { UserThemeProvider } from '@/components/theme-provider/UserThemeProvider'
import type { ThemeSettings } from '@/types/profile-sections'

/**
 * デモページ用レイアウト
 * テーマプロバイダーをデフォルト設定で提供
 */
export default function DemoLayout({ children }: { children: ReactNode }) {
  // デモページ用のデフォルト設定
  const defaultThemeSettings: ThemeSettings = {
    themePreset: 'claymorphic',
    fontFamily: 'Inter',
    visibility: {
      banner: false,
      character: true,
      gameButton: false,
      snsButton: false,
      notification: false,
    },
  }

  return (
    <UserThemeProvider themePreset="claymorphic" themeSettings={defaultThemeSettings}>
      {children}
    </UserThemeProvider>
  )
}
