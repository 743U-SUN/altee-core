'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { UserItemWithDetails } from "@/types/item"

// モーダルコンポーネントの遅延読み込み
const AddItemModal = dynamic(() => import('./AddItemModal').then(mod => ({ default: mod.AddItemModal })), {
  loading: () => <div className="h-10 w-24 bg-muted animate-pulse rounded-md" />,
  ssr: false
})

// DnD機能の遅延読み込み
const DragDropItemList = dynamic(() => import('./DragDropItemList').then(mod => ({ default: mod.DragDropItemList })), {
  loading: () => (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-muted animate-pulse rounded" />
            <div className="w-12 h-12 bg-muted animate-pulse rounded" />
            <div className="flex-1 space-y-1">
              <div className="w-32 h-4 bg-muted animate-pulse rounded" />
              <div className="w-20 h-3 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex gap-1">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="w-8 h-8 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
  ssr: false
})

interface UserItemListSectionProps {
  initialUserProducts: UserItemWithDetails[]
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
}

export function UserItemListSection({
  initialUserProducts,
  userId,
  categories,
  brands
}: UserItemListSectionProps) {
  // データ管理（シンプル化）
  const [userItems, setUserItems] = useState(initialUserProducts)

  const mutateUserItems = (newItems: UserItemWithDetails[]) => {
    setUserItems(newItems)
  }

  const handleItemsChange = (newItems: UserItemWithDetails[]) => {
    mutateUserItems(newItems)
  }

  const handleItemAdded = (newItem: UserItemWithDetails) => {
    const updatedItems = [...userItems, newItem].sort((a, b) => a.sortOrder - b.sortOrder)
    mutateUserItems(updatedItems)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">アイテム設定</h2>
          <p className="text-sm text-muted-foreground">
            使用しているアイテムを管理できます（最大30個）
          </p>
        </div>
        <AddItemModal
          userId={userId}
          categories={categories}
          brands={brands}
          onItemAdded={handleItemAdded}
        />
      </div>

      {userItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>まだアイテムが登録されていません</p>
          <p className="text-sm">「アイテムを追加」から設定を始めましょう</p>
        </div>
      ) : (
        <DragDropItemList
          userItems={userItems}
          userId={userId}
          onItemsChange={handleItemsChange}
        />
      )}
    </div>
  )
}
