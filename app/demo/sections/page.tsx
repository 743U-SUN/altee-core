import {
  getAllCategories,
  getSectionsByCategory,
  getAllSectionDefinitions,
} from '@/lib/sections/registry'
import type { SectionCategory } from '@/lib/sections/types'

/**
 * /demo/sections
 * 全セクションタイプの一覧ページ
 * lib/sections/registry.ts をベースに全セクション定義を表示
 */
export default function DemoSectionsPage() {
  const categories = getAllCategories()
  const allSections = getAllSectionDefinitions()

  const priorityBadge: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  }

  const priorityLabel: Record<string, string> = {
    high: 'HIGH',
    medium: 'MED',
    low: 'LOW',
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ヘッダー */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">セクション一覧</h1>
          <p className="mt-2 text-gray-600">
            {allSections.length} セクション / {categories.length} カテゴリ —
            レジストリ（<code className="text-sm bg-gray-200 px-1 rounded">lib/sections/registry.ts</code>）
          </p>
        </div>

        {/* カテゴリ別一覧 */}
        {categories.map(({ key, definition }) => {
          const sections = getSectionsByCategory(key as SectionCategory)
          if (sections.length === 0) return null

          return (
            <section key={key}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xl font-semibold text-gray-800">{definition.label}</h2>
                <span className="text-sm text-gray-500">({sections.length})</span>
                <span className="text-xs text-gray-400 ml-1">— {definition.description}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sections.map((section) => (
                  <div
                    key={section.type}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-2"
                  >
                    {/* タイトル行 */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{section.label}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{section.description}</p>
                      </div>
                      {section.maxInstances === 1 && (
                        <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0">
                          1個まで
                        </span>
                      )}
                    </div>

                    {/* バッジ行 */}
                    <div className="flex flex-wrap gap-1.5">
                      {section.fullBleed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700">
                          FULL BLEED
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${priorityBadge[section.priority]}`}>
                        {priorityLabel[section.priority]}
                      </span>
                    </div>

                    {/* タイプ識別子 */}
                    <div className="font-mono text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      type: <span className="text-indigo-600">&quot;{section.type}&quot;</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* 凡例 */}
        <div className="bg-white rounded-xl p-5 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">凡例</h2>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="space-y-1">
              <p className="font-medium text-gray-600">レイアウト</p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">FULL BLEED</span>
                <span className="text-gray-500">画面幅いっぱいにレンダリング</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-gray-600">読み込み優先度</p>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">HIGH</span>
                <span className="text-gray-500">即座に読み込み</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-bold">MED</span>
                <span className="text-gray-500">スクロールで読み込み</span>
              </div>
              <div className="flex gap-2">
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">LOW</span>
                <span className="text-gray-500">ビューポート外まで遅延</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
