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

// SC→CC 境界用: Date フィールドを string に変換済み（シリアライズ安全）
// ItemCategory の Date フィールドを string に変換
type SerializedItemCategory = Omit<ItemCategory, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export type SerializedItemForUserPage = Omit<Item, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  category: SerializedItemCategory
  brand?: { id: string; name: string } | null
}

export type SerializedUserItemForPublicPage = Omit<UserItem, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  item: SerializedItemForUserPage
}
