import { getAllThemes, getThemesGroupedByName } from '@/lib/themes/registry'
import { THEME_CSS_VARIABLES } from '@/lib/themes/types'
import { ThemePreviewClient } from './ThemePreviewClient'

/**
 * /demo/themes
 * 全テーマプリセットの一覧・プレビューページ（新テーマシステム版）
 */
export default function DemoThemesPage() {
  const themes = getAllThemes()
  const grouped = getThemesGroupedByName()
  const groupNames = Object.keys(grouped)
  const cssVariableKeys = [...THEME_CSS_VARIABLES]

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">テーマ一覧</h1>
          <p className="mt-2 text-gray-600">
            {themes.length} テーマ / {groupNames.length} スタイル —
            新テーマシステム（<code className="text-sm bg-gray-200 px-1 rounded">lib/themes/registry.ts</code>）
          </p>
        </div>

        <ThemePreviewClient
          themes={themes}
          grouped={grouped}
          cssVariableKeys={cssVariableKeys}
        />
      </div>
    </div>
  )
}
