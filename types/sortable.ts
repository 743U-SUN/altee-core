// 汎用ソート可能アイテムの基本インターフェース
export interface SortableItem {
  id: string
  sortOrder: number
}

// 親アイテム（カテゴリなど）
export interface SortableParentItem extends SortableItem {
  id: string
  sortOrder: number
}

// 子アイテム（Q&Aなど）
export interface SortableChildItem extends SortableItem {
  id: string
  sortOrder: number
  parentId: string
}
