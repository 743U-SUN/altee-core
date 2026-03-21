import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getDashboardNews, getDashboardNewsSection } from '@/lib/queries/news-queries'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { EditableNewsClient } from './EditableNewsClient'
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
  type SectionSettings,
} from '@/types/profile-sections'
import type { UserNewsWithImages } from '@/types/user-news'

export const metadata: Metadata = {
  title: 'NEWS管理',
  robots: { index: false, follow: false },
}

export default async function DashboardNewsPage() {
  const session = await cachedAuth()
  if (!session?.user?.id) redirect('/auth/signin')

  const [user, newsData, presets, newsSection] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        handle: true,
        profile: {
          select: {
            themePreset: true,
            themeSettings: true,
            characterImage: {
              select: { storageKey: true },
            },
          },
        },
        characterInfo: {
          select: { characterName: true },
        },
      },
    }),
    getDashboardNews(session.user.id),
    getActivePresets(),
    // ニュースセクション取得（なければ作成）- Promise.all で並列実行
    getDashboardNewsSection(session.user.id),
  ])

  if (!user || !user.profile) {
    redirect('/dashboard/setup')
  }

  const themePreset = user.profile.themePreset ?? 'claymorphic'

  let themeSettings: ThemeSettings = DEFAULT_THEME_SETTINGS
  if (user.profile.themeSettings) {
    try {
      themeSettings = user.profile.themeSettings as unknown as ThemeSettings
    } catch {
      themeSettings = DEFAULT_THEME_SETTINGS
    }
  }

  const initialData = newsData as UserNewsWithImages[]

  return (
    <div className="flex flex-1 flex-col">
      <EditableNewsClient
        handle={user.handle ?? ''}
        themePreset={themePreset}
        themeSettings={themeSettings}
        characterName={user.characterInfo?.characterName ?? null}
        initialData={initialData}
        newsSection={{
          id: newsSection.id,
          settings: newsSection.settings as SectionSettings | null,
        }}
        presets={presets}
      />
    </div>
  )
}
