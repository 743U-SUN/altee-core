'use client'

import { EditModal } from './EditModal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AvatarEditTab } from './header-edit/AvatarEditTab'
import { CharacterNameEditTab } from './header-edit/CharacterNameEditTab'
import { NamecardEditTab } from './header-edit/NamecardEditTab'
import type { ThemeSettings } from '@/types/profile-sections'

interface HeaderEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatarImageUrl?: string | null
  currentCharacterName?: string | null
  currentThemeSettings: ThemeSettings
}

/**
 * ヘッダー編集モーダル（アイコン / キャラクター名 / ネームカード）
 */
export function HeaderEditModal({
  isOpen,
  onClose,
  currentAvatarImageUrl,
  currentCharacterName,
  currentThemeSettings,
}: HeaderEditModalProps) {
  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="ヘッダーを編集"
      hideActions
    >
      <Tabs defaultValue="avatar" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="avatar">アイコン</TabsTrigger>
          <TabsTrigger value="name">キャラクター名</TabsTrigger>
          <TabsTrigger value="namecard">ネームカード</TabsTrigger>
        </TabsList>

        <TabsContent value="avatar" className="mt-4">
          <AvatarEditTab
            isOpen={isOpen}
            onClose={onClose}
            currentAvatarImageUrl={currentAvatarImageUrl}
          />
        </TabsContent>

        <TabsContent value="name" className="mt-4">
          <CharacterNameEditTab
            isOpen={isOpen}
            onClose={onClose}
            currentCharacterName={currentCharacterName}
          />
        </TabsContent>

        <TabsContent value="namecard" className="mt-4">
          <NamecardEditTab
            isOpen={isOpen}
            onClose={onClose}
            currentThemeSettings={currentThemeSettings}
          />
        </TabsContent>
      </Tabs>
    </EditModal>
  )
}
