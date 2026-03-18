import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { EditableVideosClient } from './EditableVideosClient'
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
  type UserSection,
} from '@/types/profile-sections'

export const metadata: Metadata = {
  title: '動画管理',
  robots: { index: false, follow: false },
}

export default async function VideosPage() {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const [user, presets] = await Promise.all([
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
        userSections: {
          where: { page: 'videos' },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    getActivePresets(),
  ])

  if (!user || !user.profile) {
    redirect('/dashboard/setup')
  }

  const themePreset = user.profile.themePreset ?? 'claymorphic'
  const themeSettings: ThemeSettings = user.profile.themeSettings
    ? (user.profile.themeSettings as unknown as ThemeSettings)
    : DEFAULT_THEME_SETTINGS

  const characterImageUrl = user.profile.characterImage?.storageKey
    ? getPublicUrl(user.profile.characterImage.storageKey)
    : null

  return (
    <div className="flex flex-1 flex-col">
      <EditableVideosClient
        sections={user.userSections as UserSection[]}
        presets={presets}
        userId={user.id}
        handle={user.handle ?? ''}
        themePreset={themePreset}
        themeSettings={themeSettings}
        characterImageUrl={characterImageUrl}
        characterName={user.characterInfo?.characterName ?? null}
        bannerImageKey={user.profile.bannerImageKey}
        characterBackgroundKey={user.profile.characterBackgroundKey}
      />
    </div>
  )
}
