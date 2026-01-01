'use client'

import { UserItemForPublicPage } from '@/types/item'
import { UserPublicItemCard } from './UserPublicItemCard'

interface UserPublicItemListProps {
  userItems: UserItemForPublicPage[]
  userName: string
}

export function UserPublicItemList({ userItems, userName }: UserPublicItemListProps) {
  if (userItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-muted-foreground">
            公開アイテムがありません
          </h3>
          <p className="text-sm text-muted-foreground">
            {userName}さんはまだアイテム情報を公開していません
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          {userName}さんのアイテム
        </h2>
        <p className="text-muted-foreground">
          公開されているアイテム情報とレビューを確認できます
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {userItems.map((userItem) => (
          <UserPublicItemCard
            key={userItem.id}
            userItem={userItem}
          />
        ))}
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          {userItems.length}個のアイテムが公開されています
        </p>
      </div>
    </div>
  )
}
