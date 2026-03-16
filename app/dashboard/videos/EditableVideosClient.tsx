'use client'

import { useState } from 'react'
import { EditableSectionRenderer } from '@/components/user-profile/EditableSectionRenderer'
import { UserThemeProvider } from '@/components/theme-provider/UserThemeProvider'
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
  themePreset: string
  themeSettings: ThemeSettings
}

export function EditableVideosClient({
  sections,
  presets = [],
  userId,
  themePreset,
  themeSettings,
}: EditableVideosClientProps) {
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)

  return (
    <UserThemeProvider themePreset={themePreset} themeSettings={themeSettings}>
      <div className="space-y-4">
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
    </UserThemeProvider>
  )
}
