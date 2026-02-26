'use client'

import { UserProfileLayout } from '@/components/user-profile'
import { FaqManagementSection } from './components/FaqManagementSection'
import type { ThemeSettings } from '@/types/profile-sections'

interface EditableFAQClientProps {
  handle: string
  themePreset: string
  themeSettings: ThemeSettings
  characterImageUrl: string | null
  characterName: string | null
  bannerImageKey: string | null
  characterBackgroundKey: string | null
  initialFaqCategories: unknown[]
}

/**
 * FAQ管理ページのクライアントコンポーネント
 * profile-editorと同様の2カラムレイアウトで、右側にFAQ管理UIを表示する
 */
export function EditableFAQClient({
  handle,
  themePreset,
  themeSettings,
  characterImageUrl,
  characterName,
  bannerImageKey,
  characterBackgroundKey,
  initialFaqCategories,
}: EditableFAQClientProps) {
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
        <FaqManagementSection initialFaqCategories={initialFaqCategories} />
      </div>
    </UserProfileLayout>
  )
}
