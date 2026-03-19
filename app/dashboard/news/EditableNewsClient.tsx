'use client'

import { UserProfileLayout } from '@/components/user-profile/UserProfileLayout'
import { NewsManagementSection } from './components/NewsManagementSection'
import type {
  ThemeSettings,
  SectionSettings,
  SectionBackgroundPreset,
} from '@/types/profile-sections'
import type { UserNewsWithImages } from '@/types/user-news'

interface EditableNewsClientProps {
  handle: string
  themePreset: string
  themeSettings: ThemeSettings
  characterName: string | null
  initialData: UserNewsWithImages[]
  newsSection: { id: string; settings: SectionSettings | null }
  presets: SectionBackgroundPreset[]
}

/**
 * NEWS管理ページのクライアントコンポーネント
 * profile-editor/faqsと同様の2カラムレイアウトで、右側にNEWS管理UIを表示する
 */
export function EditableNewsClient({
  handle,
  themePreset,
  themeSettings,
  characterName,
  initialData,
  newsSection,
  presets,
}: EditableNewsClientProps) {
  return (
    <UserProfileLayout
      handle={handle}
      themePreset={themePreset}
      themeSettings={themeSettings}
      characterName={characterName}
      isEditable={false}
      inDashboard={true}
    >
      <div className="space-y-6 w-full">
        <NewsManagementSection
          initialData={initialData}
          newsSection={newsSection}
          presets={presets}
        />
      </div>
    </UserProfileLayout>
  )
}
