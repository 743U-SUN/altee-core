import { resolveAvatarUrl } from '@/lib/avatar-utils'
import { getUserByHandle, handleExists } from '@/lib/handle-utils'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { isReservedHandle } from '@/lib/reserved-handles'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import { UserThemeProvider } from '@/components/theme-provider/UserThemeProvider'
import { ProfileHeader } from '@/components/user-profile/ProfileHeader'
import { MobileBottomNav } from '@/components/user-profile/MobileBottomNav'
import { FloatingElements } from '@/components/user-profile/FloatingElements'
import { Skeleton } from '@/components/ui/skeleton'
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
 * generateMetadata: getUserByHandle は React.cache() 済みなので
 * layout 本体とリクエスト単位でデデュプリケーションされる
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

/**
 * ヘッダー部分を非同期Server Componentとして分離
 * Suspenseでラップすることでページ本体のレンダリングをブロックしない
 */
async function ProfileHeaderWrapper({ handle }: { handle: string }) {
  const targetUser = await getUserByHandle(handle)
  if (!targetUser || !targetUser.profile) return null

  const themeSettings = resolveThemeSettings(targetUser.profile.themeSettings)
  const avatarImageUrl = resolveAvatarUrl(
    targetUser.characterInfo?.iconImageKey,
    targetUser.image
  )

  return (
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
  )
}

/**
 * HandleLayoutContent: Suspense 内でフルデータ取得 + テーマ適用
 * getUserByHandle は React.cache() でリクエスト内 dedup される
 */
async function HandleLayoutContent({ handle, children }: { handle: string; children: ReactNode }) {
  const targetUser = await getUserByHandle(handle)
  if (!targetUser || !targetUser.profile) notFound()

  const themePreset = targetUser.profile.themePreset || 'claymorphic'
  const themeSettings = resolveThemeSettings(targetUser.profile.themeSettings)
  const backgroundStyle = calculateBackgroundStyle(themeSettings)

  return (
    <UserThemeProvider themePreset={themePreset} themeSettings={themeSettings}>
      <ProfileLayout
        header={
          <Suspense fallback={null}>
            <ProfileHeaderWrapper handle={handle} />
          </Suspense>
        }
        bottomNav={
          <Suspense fallback={null}>
            <MobileBottomNav
              handle={handle}
              inDashboard={false}
              visibility={themeSettings.visibility}
            />
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

/**
 * HandleLayoutSkeleton: PPR static shell 用の静的スケルトン
 * テーマ未確定のため中立的な bg-background を使用
 */
function HandleLayoutSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* プロフィールヘッダー相当 */}
      <div className="w-full p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      {/* コンテンツ領域 */}
      <main className="flex-1 w-full p-6 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </main>
    </div>
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

  // 軽量な存在チェック（Suspense 前で正しい HTTP 404 を保証）
  const exists = await handleExists(handle)
  if (!exists) {
    notFound()
  }

  return (
    <Suspense fallback={<HandleLayoutSkeleton />}>
      <HandleLayoutContent handle={handle}>{children}</HandleLayoutContent>
    </Suspense>
  )
}
