import { UserProfileLayout } from '@/components/user-profile/UserProfileLayout'
import { FaqManagementSection } from './components/FaqManagementSection'
import type { ThemeSettings, SectionBackgroundPreset } from '@/types/profile-sections'

interface EditableFAQClientProps {
  handle: string
  themePreset: string
  themeSettings: ThemeSettings
  characterName: string | null
  initialFaqCategories: unknown[]
  presets: SectionBackgroundPreset[]
}

/**
 * FAQ管理ページのクライアントコンポーネント
 * profile-editorと同様の2カラムレイアウトで、右側にFAQ管理UIを表示する
 */
export function EditableFAQClient({
  handle,
  themePreset,
  themeSettings,
  characterName,
  initialFaqCategories,
  presets,
}: EditableFAQClientProps) {
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
        <FaqManagementSection initialFaqCategories={initialFaqCategories} presets={presets} />
      </div>
    </UserProfileLayout>
  )
}
