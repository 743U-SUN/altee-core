import { ItemCategory, Item, UserItem, User } from '@prisma/client'

// アイテム詳細情報の型
export type ItemWithDetails = Item & {
  category: ItemCategory
  brand?: { id: string; name: string } | null
  userItems: (UserItem & {
    user: Pick<User, 'name' | 'handle'>
  })[]
}

// ユーザーアイテム詳細情報の型
export type UserItemWithDetails = UserItem & {
  item: ItemWithDetails
}

// ユーザー公開ページ用のアイテム詳細型（他ユーザー情報を含まない）
export type ItemForUserPage = Item & {
  category: ItemCategory
  brand?: { id: string; name: string } | null
}

// ユーザー公開ページ用のユーザーアイテム型
export type UserItemForPublicPage = UserItem & {
  item: ItemForUserPage
}
