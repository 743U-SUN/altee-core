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

  const [user, newsData, presets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: {
          include: {
            characterImage: true,
          },
        },
        characterInfo: {
          select: { characterName: true },
        },
      },
    }),
    getDashboardNews(session.user.id),
    getActivePresets(),
  ])

  if (!user || !user.profile) {
    redirect('/dashboard/setup')
  }

  // ニュースセクション取得（なければ作成）
  const newsSection = await getDashboardNewsSection(session.user.id)

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
