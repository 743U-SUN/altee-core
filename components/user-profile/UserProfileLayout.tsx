'use client'

import { memo, useMemo } from 'react'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { UserThemeProvider } from '@/components/theme-provider/UserThemeProvider'
import { ProfileLayout } from '@/components/profile/ProfileLayout'
import type { ThemeSettings } from '@/types/profile-sections'
import type { ReactNode, CSSProperties } from 'react'
import { ProfileHeader } from './ProfileHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { FloatingElements } from './FloatingElements'

interface UserProfileLayoutProps {
  handle: string
  themePreset: string
  themeSettings: ThemeSettings
  avatarImageUrl?: string | null    // アイコン画像（1:1正方形、ヘッダー用）
  characterName?: string | null
  children: ReactNode
  isEditable?: boolean
  inDashboard?: boolean // ダッシュボード内の場合はtrue
  onImageEdit?: (type: 'banner' | 'character' | 'profile') => void
  onNotificationClick?: (type: 'gift' | 'mail' | 'bell') => void
}

/**
 * ユーザープロフィールのメインレイアウト
 *
 * @deprecated Phase 3で1カラムレイアウトに移行しました。
 * 新規実装では ProfileLayout を直接使用してください。
 * このコンポーネントは後方互換性のために残されています。
 *
 * 1カラムレイアウト（全デバイス共通）
 * - キャラクター画像はPhase 4でCharacterProfileSectionとして実装予定
 */
export const UserProfileLayout = memo(function UserProfileLayout({
  handle,
  themePreset,
  themeSettings,
  avatarImageUrl,
  characterName,
  children,
  isEditable = false,
  inDashboard = false,
  onImageEdit,
  onNotificationClick,
}: UserProfileLayoutProps) {
  const background = themeSettings.background

  // 背景スタイルを計算
  const backgroundStyle = useMemo((): CSSProperties => {
    if (!background || background.type === 'preset') {
      return { backgroundColor: 'var(--theme-bg)' }
    }

    if (background.type === 'color' && background.color) {
      return { backgroundColor: background.color }
    }

    if (background.type === 'image' && background.imageKey) {
      return {
        backgroundImage: `url(${getPublicUrl(background.imageKey)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    }

    return { backgroundColor: 'var(--theme-bg)' }
  }, [background])

  return (
    <UserThemeProvider
      themePreset={themePreset}
      themeSettings={themeSettings}
    >
      <ProfileLayout
        header={
          <ProfileHeader
            handle={handle}
            avatarImageUrl={avatarImageUrl}
            characterName={characterName}
            visibility={themeSettings.visibility}
            namecard={themeSettings.namecard}
            isEditable={isEditable}
            inDashboard={inDashboard}
            onImageEdit={onImageEdit}
            onNotificationClick={onNotificationClick}
          />
        }
        bottomNav={
          <MobileBottomNav handle={handle} inDashboard={inDashboard} />
        }
        floatingElements={
          <FloatingElements
            visibility={themeSettings.visibility}
            isEditable={isEditable}
            inDashboard={inDashboard}
            onNotificationClick={onNotificationClick}
          />
        }
        backgroundStyle={backgroundStyle}
      >
        {children}
      </ProfileLayout>
    </UserThemeProvider>
  )
})
