// 汎用ソート可能アイテムの基本インターフェース
export interface SortableItem {
  id: string;
  sortOrder: number;
}

// 親アイテム（カテゴリなど）
export interface SortableParentItem extends SortableItem {
  id: string;
  sortOrder: number;
}

// 子アイテム（Q&Aなど）
export interface SortableChildItem extends SortableItem {
  id: string;
  sortOrder: number;
  parentId: string;
}

// 編集可能フィールドの定義
export interface EditableField {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder?: string;
  maxLength?: number;
  validation?: (value: string) => string | null; // エラーメッセージまたはnull
}

// 単一レベルのソート可能リストの設定
export interface SortableListConfig<T extends SortableItem> {
  // データ
  items: T[];
  
  // イベントハンドラー
  onReorder: (reorderedItems: T[]) => Promise<void>;
  onAdd?: () => Promise<void>;
  onEdit?: (itemId: string, updates: Partial<T>) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  
  // 表示設定
  editableFields: EditableField[];
  itemDisplayName: (item: T, index: number) => string;
  
  // UI設定
  maxItems?: number;
  addButtonText?: string;
  emptyStateText?: string;
  emptyStateDescription?: string;
  dragHandlePosition?: 'left' | 'right';
}

// ネストしたソート可能リストの設定
export interface NestedSortableListConfig<TParent extends SortableParentItem, TChild extends SortableChildItem> {
  // データ
  parentItems: TParent[];
  getChildItems: (parentId: string) => TChild[];
  
  // 親アイテムの設定
  parentConfig: {
    editableFields: EditableField[];
    itemDisplayName: (item: TParent, index: number) => string;
    onReorder: (items: TParent[]) => Promise<void>;
    onAdd?: () => Promise<void>;
    onEdit?: (itemId: string, updates: Partial<TParent>) => Promise<void>;
    onDelete?: (itemId: string) => Promise<void>;
    maxItems?: number;
    addButtonText?: string;
    emptyStateText?: string;
    emptyStateDescription?: string;
  };
  
  // 子アイテムの設定
  childConfig: {
    editableFields: EditableField[];
    itemDisplayName: (item: TChild, index: number) => string;
    onReorder: (parentId: string, items: TChild[]) => Promise<void>;
    onAdd?: (parentId: string) => Promise<void>;
    onEdit?: (parentId: string, itemId: string, updates: Partial<TChild>) => Promise<void>;
    onDelete?: (parentId: string, itemId: string) => Promise<void>;
    maxItems?: number;
    addButtonText?: string;
    emptyStateText?: string;
    emptyStateDescription?: string;
    childListLabel?: (parentItem: TParent, childCount: number) => string;
  };
}

// アイテムの状態
export interface ItemState {
  isEditing: { [itemId: string]: boolean };
  isDeleting: { [itemId: string]: boolean };
  isSaving: { [itemId: string]: boolean };
  tempValues: { [itemId: string]: { [fieldKey: string]: string } };
}