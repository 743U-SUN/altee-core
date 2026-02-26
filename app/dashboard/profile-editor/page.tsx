import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { EditableProfileClient } from './EditableProfileClient'

export const metadata: Metadata = {
  title: 'プロフィール編集',
  robots: { index: false, follow: false },
}
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
  type UserSection,
} from '@/types/profile-sections'

export default async function ProfileEditorPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // ユーザーデータとプリセットを並列取得
  const [user, presets] = await Promise.all([
    prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      profile: {
        include: {
          characterImage: true, // キャラクター画像（9:16縦長）
          avatarImage: { select: { storageKey: true } }, // アイコン画像（1:1正方形）
        },
      },
      userSections: {
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
    ? `/api/files/${user.profile.characterImage.storageKey}`
    : null
  const avatarImageUrl = user.profile.avatarImage?.storageKey
    ? `/api/files/${user.profile.avatarImage.storageKey}`
    : null

  return (
    <div className="flex flex-1 flex-col">
      <EditableProfileClient
        handle={user.handle || ''}
        themePreset={themePreset}
        themeSettings={themeSettings}
        characterImageUrl={characterImageUrl}
        characterImageId={user.profile.characterImageId}
        avatarImageUrl={avatarImageUrl}
        characterName={user.characterName}
        bannerImageKey={user.profile.bannerImageKey}
        characterBackgroundKey={user.profile.characterBackgroundKey}
        sections={user.userSections as UserSection[]}
        presets={presets}
        userId={user.id}
      />
    </div>
  )
}
