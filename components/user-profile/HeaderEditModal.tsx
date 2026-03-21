'use client'

import dynamic from 'next/dynamic'
import { EditModal } from './EditModal'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { ThemeSettings } from '@/types/profile-sections'

const AvatarEditTab = dynamic(() =>
  import('./header-edit/AvatarEditTab').then(m => ({ default: m.AvatarEditTab }))
)
const CharacterNameEditTab = dynamic(() =>
  import('./header-edit/CharacterNameEditTab').then(m => ({ default: m.CharacterNameEditTab }))
)
const NamecardEditTab = dynamic(() =>
  import('./header-edit/NamecardEditTab').then(m => ({ default: m.NamecardEditTab }))
)

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
            key={isOpen ? 'open' : 'closed'}
            onClose={onClose}
            currentAvatarImageUrl={currentAvatarImageUrl}
          />
        </TabsContent>

        <TabsContent value="name" className="mt-4">
          <CharacterNameEditTab
            key={isOpen ? 'open' : 'closed'}
            onClose={onClose}
            currentCharacterName={currentCharacterName}
          />
        </TabsContent>

        <TabsContent value="namecard" className="mt-4">
          <NamecardEditTab
            key={isOpen ? 'open' : 'closed'}
            onClose={onClose}
            currentThemeSettings={currentThemeSettings}
          />
        </TabsContent>
      </Tabs>
    </EditModal>
  )
}
