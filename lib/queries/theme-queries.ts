import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import type { ThemeSettings } from '@/types/profile-sections'
import { DEFAULT_THEME_SETTINGS } from '@/types/profile-sections'

/**
 * ユーザーのテーマ設定を取得
 */
export const getUserThemeSettings = cache(async (
  userId: string
): Promise<ThemeSettings | null> => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { themeSettings: true },
    })

    return (
      (profile?.themeSettings as unknown as ThemeSettings) ??
      DEFAULT_THEME_SETTINGS
    )
  } catch {
    return null
  }
})
