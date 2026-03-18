import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { getUserNews } from '@/app/actions/content/user-news-actions'
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

  const [user, newsResult, presets, existingSection] = await Promise.all([
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
    getUserNews(),
    getActivePresets(),
    prisma.userSection.findFirst({
      where: {
        userId: session.user.id,
        page: 'news',
        sectionType: 'news-list',
      },
    }),
  ])

  if (!user || !user.profile) {
    redirect('/dashboard/setup')
  }

  // ニュースセクションが存在しない場合は作成
  const newsSection =
    existingSection ??
    (await prisma.userSection.create({
      data: {
        userId: session.user.id,
        sectionType: 'news-list',
        page: 'news',
        title: null,
        sortOrder: 0,
        isVisible: true,
        data: {},
        settings: null as never,
      },
    }))

  const themePreset = user.profile.themePreset ?? 'claymorphic'

  let themeSettings: ThemeSettings = DEFAULT_THEME_SETTINGS
  if (user.profile.themeSettings) {
    try {
      themeSettings = user.profile.themeSettings as unknown as ThemeSettings
    } catch {
      themeSettings = DEFAULT_THEME_SETTINGS
    }
  }

  const characterImageUrl = user.profile.characterImage?.storageKey
    ? getPublicUrl(user.profile.characterImage.storageKey)
    : null

  const initialData = newsResult.success ? (newsResult.data as UserNewsWithImages[]) : []

  return (
    <div className="flex flex-1 flex-col">
      <EditableNewsClient
        handle={user.handle ?? ''}
        themePreset={themePreset}
        themeSettings={themeSettings}
        characterImageUrl={characterImageUrl}
        characterName={user.characterInfo?.characterName ?? null}
        bannerImageKey={user.profile.bannerImageKey}
        characterBackgroundKey={user.profile.characterBackgroundKey}
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
