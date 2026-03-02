'use client'

import { useState, useCallback } from 'react'
import { UserProfileLayout } from '@/components/user-profile/UserProfileLayout'
import { EditableSectionRenderer } from '@/components/user-profile/EditableSectionRenderer'
import { BannerImageModal } from '@/components/user-profile/BannerImageModal'
import { CharacterImageModal } from '@/components/user-profile/CharacterImageModal'
import { HeaderEditModal } from '@/components/user-profile/HeaderEditModal'
import { NotificationEditModal } from '@/components/user-profile/NotificationEditModal'
import { AddSectionModal } from './components/AddSectionModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type {
  ThemeSettings,
  UserSection,
  SectionBackgroundPreset,
} from '@/types/profile-sections'

interface EditableProfileClientProps {
  handle: string
  themePreset: string
  themeSettings: ThemeSettings
  characterImageUrl: string | null  // キャラクター画像（9:16縦長）
  characterImageId: string | null
  avatarImageUrl: string | null     // アイコン画像（1:1正方形、ヘッダー用）
  characterName: string | null
  bannerImageKey: string | null
  characterBackgroundKey: string | null // CharacterColumn専用背景
  sections: UserSection[]
  presets?: SectionBackgroundPreset[]
  userId: string
}

/**
 * 編集可能なプロフィールページのクライアントコンポーネント
 * 編集モーダルの状態管理を行う
 */
export function EditableProfileClient({
  handle,
  themePreset,
  themeSettings,
  characterImageUrl,
  characterImageId,
  avatarImageUrl,
  characterName,
  bannerImageKey,
  characterBackgroundKey,
  sections,
  presets = [],
  userId,
}: EditableProfileClientProps) {
  const [imageEditType, setImageEditType] = useState<
    'banner' | 'character' | 'profile' | null
  >(null)
  const [notificationEditType, setNotificationEditType] = useState<
    'gift' | 'mail' | 'bell' | null
  >(null)
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)

  const handleImageEdit = useCallback((type: 'banner' | 'character' | 'profile') => {
    setImageEditType(type)
  }, [])

  const handleImageEditClose = useCallback(() => {
    setImageEditType(null)
  }, [])

  const handleNotificationClick = useCallback((type: 'gift' | 'mail' | 'bell') => {
    setNotificationEditType(type)
  }, [])

  const handleNotificationClose = useCallback(() => {
    setNotificationEditType(null)
  }, [])

  return (
    <>
      <UserProfileLayout
        handle={handle}
        themePreset={themePreset}
        themeSettings={themeSettings}
        characterImageUrl={characterImageUrl}
        avatarImageUrl={avatarImageUrl}
        characterName={characterName}
        bannerImageKey={bannerImageKey}
        characterBackgroundKey={characterBackgroundKey}
        isEditable={true}
        inDashboard={true}
        onImageEdit={handleImageEdit}
        onNotificationClick={handleNotificationClick}
      >
        <div className="w-full">
          <EditableSectionRenderer sections={sections} presets={presets} />
          <div className="flex justify-center py-4">
            <Button
              onClick={() => setIsAddSectionModalOpen(true)}
              variant="outline"
              size="lg"
              className="px-8"
            >
              <Plus className="w-5 h-5 mr-2" />
              セクションを追加
            </Button>
          </div>
        </div>
      </UserProfileLayout>

      <BannerImageModal
        isOpen={imageEditType === 'banner'}
        onClose={handleImageEditClose}
        currentBackgroundKey={bannerImageKey}
      />
      <CharacterImageModal
        isOpen={imageEditType === 'character'}
        onClose={handleImageEditClose}
        currentCharacterImageId={characterImageId}
        currentCharacterImageUrl={characterImageUrl}
        currentCharacterBackgroundKey={characterBackgroundKey}
      />
      <HeaderEditModal
        isOpen={imageEditType === 'profile'}
        onClose={handleImageEditClose}
        currentAvatarImageUrl={avatarImageUrl}
        currentCharacterName={characterName}
        currentThemeSettings={themeSettings}
      />
      <NotificationEditModal
        isOpen={notificationEditType !== null}
        onClose={handleNotificationClose}
        type={notificationEditType ?? 'gift'}
      />
      <AddSectionModal
        open={isAddSectionModalOpen}
        onOpenChange={setIsAddSectionModalOpen}
        userId={userId}
        existingSections={sections}
      />
    </>
  )
}
