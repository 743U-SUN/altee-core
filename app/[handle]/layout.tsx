import { getUserByHandle } from '@/lib/handle-utils'
import { isReservedHandle } from '@/lib/reserved-handles'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { UserThemeProvider } from '@/components/theme-provider/UserThemeProvider'
import { ProfileHeader } from '@/components/user-profile/ProfileHeader'
import { MobileBottomNav } from '@/components/user-profile/MobileBottomNav'
import { FloatingElements } from '@/components/user-profile/FloatingElements'
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
} from '@/types/profile-sections'
import type { CSSProperties } from 'react'

// 背景スタイル計算（サーバー側で実行）
function calculateBackgroundStyle(themeSettings: ThemeSettings): CSSProperties {
  const bg = themeSettings.background

  if (!bg || bg.type === 'preset') {
    return { backgroundColor: 'var(--theme-bg)' }
  }

  if (bg.type === 'color' && bg.color) {
    return { backgroundColor: bg.color }
  }

  if (bg.type === 'image' && bg.imageKey) {
    return {
      backgroundImage: `url(/api/files/${bg.imageKey})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  return { backgroundColor: 'var(--theme-bg)' }
}

export default async function HandleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  // 予約済みhandleチェック（システムパスとの衝突を防ぐ）
  if (isReservedHandle(handle)) {
    notFound()
  }

  // ページ対象のユーザー情報を取得
  const targetUser = await getUserByHandle(handle)
  if (!targetUser || !targetUser.profile) {
    notFound()
  }

  // テーマ設定を取得（デフォルト値にフォールバック）
  const themePreset = targetUser.profile.themePreset || 'claymorphic'

  let themeSettings: ThemeSettings = DEFAULT_THEME_SETTINGS
  if (targetUser.profile.themeSettings) {
    try {
      themeSettings = targetUser.profile.themeSettings as unknown as ThemeSettings
    } catch {
      themeSettings = DEFAULT_THEME_SETTINGS
    }
  }

  // アイコン画像を取得（1:1正方形）
  let avatarImageUrl: string | null = null
  if (targetUser.profile.avatarImage?.storageKey) {
    avatarImageUrl = `/api/files/${targetUser.profile.avatarImage.storageKey}`
  }

  // 背景スタイルを計算
  const backgroundStyle = calculateBackgroundStyle(themeSettings)

  return (
    <UserThemeProvider themePreset={themePreset} themeSettings={themeSettings}>
      <ProfileLayout
        header={
          <Suspense fallback={null}>
            <ProfileHeader
              handle={handle}
              avatarImageUrl={avatarImageUrl}
              characterName={targetUser.characterName}
              visibility={themeSettings.visibility}
              namecard={themeSettings.namecard}
              isEditable={false}
              inDashboard={false}
            />
          </Suspense>
        }
        bottomNav={
          <Suspense fallback={null}>
            <MobileBottomNav handle={handle} inDashboard={false} />
          </Suspense>
        }
        floatingElements={
          <FloatingElements
            visibility={themeSettings.visibility}
            isEditable={false}
            inDashboard={false}
          />
        }
        backgroundStyle={backgroundStyle}
      >
        {children}
      </ProfileLayout>
    </UserThemeProvider>
  )
}
