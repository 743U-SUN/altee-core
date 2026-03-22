import { resolveAvatarUrl } from '@/lib/avatar-utils'
import { getUserByHandle } from '@/lib/handle-utils'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { isReservedHandle } from '@/lib/reserved-handles'
import { notFound } from 'next/navigation'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { UserThemeProvider } from '@/components/theme-provider/UserThemeProvider'
import { ProfileHeader } from '@/components/user-profile/ProfileHeader'
import { MobileBottomNav } from '@/components/user-profile/MobileBottomNav'
import { FloatingElements } from '@/components/user-profile/FloatingElements'
import {
  DEFAULT_THEME_SETTINGS,
  type ThemeSettings,
} from '@/types/profile-sections'
import type { CSSProperties, ReactNode } from 'react'
import type { Metadata } from 'next'

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
      backgroundImage: `url(${getPublicUrl(bg.imageKey)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
  }

  return { backgroundColor: 'var(--theme-bg)' }
}

// テーマ設定を解決するヘルパー
function resolveThemeSettings(
  profileThemeSettings: unknown
): ThemeSettings {
  if (profileThemeSettings) {
    try {
      return profileThemeSettings as ThemeSettings
    } catch {
      return DEFAULT_THEME_SETTINGS
    }
  }
  return DEFAULT_THEME_SETTINGS
}

interface HandleLayoutProps {
  children: ReactNode
  params: Promise<{ handle: string }>
}

/**
 * generateMetadata: getUserByHandle は 'use cache' (cross-request) 済みなので
 * layout 本体とキャッシュヒットによりデデュプリケーションされる
 */
export async function generateMetadata({
  params,
}: HandleLayoutProps): Promise<Metadata> {
  const { handle } = await params

  if (isReservedHandle(handle)) {
    return { title: 'Not Found' }
  }

  const targetUser = await getUserByHandle(handle)
  if (!targetUser || !targetUser.profile) {
    return { title: 'Not Found' }
  }

  const displayName =
    targetUser.characterInfo?.characterName ?? targetUser.name ?? handle

  return {
    title: {
      template: `%s | ${displayName}`,
      default: displayName,
    },
    description: `${displayName}のプロフィールページ`,
    openGraph: {
      title: displayName,
      description: `${displayName}のプロフィールページ`,
    },
  }
}


type TargetUser = NonNullable<Awaited<ReturnType<typeof getUserByHandle>>>

interface HandleLayoutContentProps {
  handle: string
  children: ReactNode
  targetUser: TargetUser
}

/**
 * HandleLayoutContent: 同期 Server Component — Suspense は不要
 * ユーザーデータは HandleLayout で取得済みのものを受け取る
 */
function HandleLayoutContent({ handle, children, targetUser }: HandleLayoutContentProps) {
  const themePreset = targetUser.profile!.themePreset || 'claymorphic'
  const themeSettings = resolveThemeSettings(targetUser.profile!.themeSettings)
  const backgroundStyle = calculateBackgroundStyle(themeSettings)

  const avatarImageUrl = resolveAvatarUrl(
    targetUser.characterInfo?.iconImageKey,
    targetUser.image
  )

  return (
    <UserThemeProvider themePreset={themePreset} themeSettings={themeSettings}>
      <ProfileLayout
        header={
          <ProfileHeader
            handle={handle}
            avatarImageUrl={avatarImageUrl}
            characterName={
              targetUser.characterInfo?.characterName ?? targetUser.name
            }
            visibility={themeSettings.visibility}
            namecard={themeSettings.namecard}
            isEditable={false}
            inDashboard={false}
            isManaged={targetUser.accountType === 'MANAGED'}
          />
        }
        bottomNav={
          <MobileBottomNav
            handle={handle}
            inDashboard={false}
            visibility={themeSettings.visibility}
          />
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

export default async function HandleLayout({
  children,
  params,
}: HandleLayoutProps) {
  const { handle } = await params

  // 予約済みhandleチェック（システムパスとの衝突を防ぐ）
  if (isReservedHandle(handle)) {
    notFound()
  }

  // getUserByHandle は 'use cache' (cross-request) 済みなのでキャッシュヒット時はDBアクセスなし
  // notFound() は Suspense 外で呼ぶ（CLAUDE.md ルール準拠）
  const targetUser = await getUserByHandle(handle)
  if (!targetUser || !targetUser.profile) {
    notFound()
  }

  return (
    <HandleLayoutContent handle={handle} targetUser={targetUser}>
      {children}
    </HandleLayoutContent>
  )
}
