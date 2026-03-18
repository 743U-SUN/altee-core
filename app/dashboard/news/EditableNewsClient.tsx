'use client'

import { UserProfileLayout } from '@/components/user-profile'
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
  characterImageUrl: string | null
  characterName: string | null
  bannerImageKey: string | null
  characterBackgroundKey: string | null
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
  characterImageUrl,
  characterName,
  bannerImageKey,
  characterBackgroundKey,
  initialData,
  newsSection,
  presets,
}: EditableNewsClientProps) {
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
