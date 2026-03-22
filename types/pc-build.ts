import type { UserPcBuild, UserPcBuildPart, Item, Brand, ItemCategory } from '@prisma/client'

// パーツ（カタログアイテム付き）
export type PcBuildPartWithItem = UserPcBuildPart & {
  item: (Item & {
    brand: Brand | null
    category: ItemCategory
  }) | null
}

// ビルド全体（パーツにアイテム情報含む）
export type PcBuildWithParts = UserPcBuild & {
  parts: PcBuildPartWithItem[]
}

// SC→CC 境界用: Date フィールドを string に変換済み（シリアライズ安全）
type SerializedItemCategory = Omit<ItemCategory, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type SerializedBrand = Omit<Brand, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

type SerializedItem = Omit<Item, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  brand: SerializedBrand | null
  category: SerializedItemCategory
}

export type SerializedPcBuildPartWithItem = Omit<UserPcBuildPart, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  item: SerializedItem | null
}

export type SerializedPcBuildWithParts = Omit<UserPcBuild, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
  parts: SerializedPcBuildPartWithItem[]
}
