'use client'

import { useState } from 'react'
import { EditableSectionRenderer } from '@/components/user-profile/EditableSectionRenderer'
import { UserProfileLayout } from '@/components/user-profile'
import { AddVideoSectionModal } from './components/AddVideoSectionModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type {
  UserSection,
  SectionBackgroundPreset,
  ThemeSettings,
} from '@/types/profile-sections'

interface EditableVideosClientProps {
  sections: UserSection[]
  presets?: SectionBackgroundPreset[]
  userId: string
  handle: string
  themePreset: string
  themeSettings: ThemeSettings
  characterImageUrl: string | null
  characterName: string | null
  bannerImageKey: string | null
  characterBackgroundKey: string | null
}

export function EditableVideosClient({
  sections,
  presets = [],
  userId,
  handle,
  themePreset,
  themeSettings,
  characterImageUrl,
  characterName,
  bannerImageKey,
  characterBackgroundKey,
}: EditableVideosClientProps) {
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)

  return (
    <UserProfileLayout
      handle={handle}
      themePreset={themePreset}
      themeSettings={themeSettings}
      characterImageUrl={characterImageUrl}
      characterName={characterName}
      bannerImageKey={bannerImageKey}
      characterBackgroundKey={characterBackgroundKey}
      isEditable={false}
      inDashboard={true}
    >
      <div className="space-y-4 w-full">
        {/* セクション一覧 */}
        <EditableSectionRenderer
          sections={sections}
          presets={presets}
        />

        {/* セクション追加ボタン */}
        <div className="flex justify-center py-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsAddSectionModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            セクションを追加
          </Button>
        </div>

        {/* セクション追加モーダル */}
        <AddVideoSectionModal
          open={isAddSectionModalOpen}
          onOpenChange={setIsAddSectionModalOpen}
          userId={userId}
          existingSections={sections}
        />
      </div>
    </UserProfileLayout>
  )
}
