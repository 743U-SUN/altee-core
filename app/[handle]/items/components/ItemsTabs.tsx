'use client'

import { startTransition } from 'react'
import { useQueryState } from 'nuqs'
import { Package, Monitor } from 'lucide-react'
import { UserPublicItemList } from './UserPublicItemList'
import { PcSpecsView } from './PcSpecsView'
import type { UserItemForPublicPage } from '@/types/item'
import type { PcBuildWithParts } from '@/types/pc-build'
import type { ReactNode } from 'react'

interface ItemsTabsProps {
  userItems: UserItemForPublicPage[]
  pcBuild: PcBuildWithParts | null
  userName: string
}

const tabs: { key: string; label: string; icon: ReactNode }[] = [
  { key: 'items', label: 'アイテム', icon: <Package className="w-4 h-4" /> },
  { key: 'pc-specs', label: 'PC Specs', icon: <Monitor className="w-4 h-4" /> },
]

const tabClass = (active: boolean) =>
  `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
    active
      ? 'border-foreground text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground'
  }`

export function ItemsTabs({ userItems, pcBuild, userName }: ItemsTabsProps) {
  const [tab, setTab] = useQueryState('tab', { defaultValue: 'items', shallow: true })
  const hasPcBuild = pcBuild !== null

  const activeTab = tab === 'pc-specs' ? 'pc-specs' : 'items'

  const handleTabChange = (key: string) => {
    startTransition(() => {
      setTab(key)
    })
  }

  return (
    <div className="space-y-6">
      {/* タブナビ（PC Specsがある場合のみ表示） */}
      {hasPcBuild && (
        <nav className="flex gap-1 border-b" role="tablist" aria-label="アイテムタブ">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={activeTab === t.key}
              aria-controls={`tabpanel-${t.key}`}
              onClick={() => handleTabChange(t.key)}
              className={tabClass(activeTab === t.key)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      )}

      {/* コンテンツ */}
      {activeTab === 'pc-specs' ? (
        <div id="tabpanel-pc-specs" role="tabpanel">
          <PcSpecsView pcBuild={pcBuild} userName={userName} />
        </div>
      ) : (
        <div id="tabpanel-items" role="tabpanel">
          <UserPublicItemList userItems={userItems} userName={userName} />
        </div>
      )}
    </div>
  )
}
