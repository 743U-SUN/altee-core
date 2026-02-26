'use client'

import { useContext } from 'react'
import { UserThemeContext } from './UserThemeProvider'

/**
 * ユーザーテーマ情報を取得するフック
 */
export function useUserTheme() {
  const context = useContext(UserThemeContext)
  if (!context) {
    throw new Error('useUserTheme must be used within UserThemeProvider')
  }
  return context
}
