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
