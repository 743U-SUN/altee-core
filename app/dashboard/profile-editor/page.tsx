import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { resolveAvatarUrl } from '@/lib/avatar-utils'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
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
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // ユーザーデータとプリセットを並列取得
  const [user, presets] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        handle: true,
        image: true,
        profile: {
          select: {
            themePreset: true,
            themeSettings: true,
            bannerImageKey: true,
            characterBackgroundKey: true,
            characterImage: {
              select: { storageKey: true },
            },
          },
        },
        characterInfo: {
          select: { characterName: true, iconImageKey: true },
        },
        userSections: {
          where: { page: 'profile' },
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
  const avatarImageUrl = resolveAvatarUrl(user.characterInfo?.iconImageKey, user.image)

  // DateオブジェクトをISO文字列に変換してRSC境界を超えられるようにする
  const sections = (user.userSections as UserSection[]).map((s) => ({
    ...s,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    updatedAt: s.updatedAt instanceof Date ? s.updatedAt.toISOString() : s.updatedAt,
  })) as unknown as UserSection[]

  return (
    <div className="flex flex-1 flex-col">
      <EditableProfileClient
        handle={user.handle || ''}
        themePreset={themePreset}
        themeSettings={themeSettings}
        characterImageUrl={characterImageUrl}
        avatarImageUrl={avatarImageUrl}
        characterName={user.characterInfo?.characterName ?? null}
        bannerImageKey={user.profile.bannerImageKey}
        characterBackgroundKey={user.profile.characterBackgroundKey}
        sections={sections}
        presets={presets}
        userId={user.id}
      />
    </div>
  )
}
