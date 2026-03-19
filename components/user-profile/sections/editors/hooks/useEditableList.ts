import { useState } from 'react'
import { nanoid } from 'nanoid'

interface EditableItem {
  id: string
  sortOrder: number
}

interface UseEditableListOptions<T extends EditableItem> {
  initialItems: T[]
  createEmptyItem: (sortOrder: number) => Omit<T, 'id' | 'sortOrder'>
}

/**
 * 7エディタ共通のリスト管理ロジック
 * 追加・削除・移動・編集トグル・Escapeキャンセル・フィールド変更を提供
 */
export function useEditableList<T extends EditableItem>({
  initialItems,
  createEmptyItem,
}: UseEditableListOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingBackup, setEditingBackup] = useState<T | null>(null)

  const handleAdd = () => {
    const newItem = {
      ...createEmptyItem(items.length),
      id: nanoid(),
      sortOrder: items.length,
    } as T
    setItems([...items, newItem])
    setEditingBackup({ ...newItem })
    setEditingItemId(newItem.id)
    return newItem.id
  }

  const handleCloseEdit = () => {
    setEditingItemId(null)
    setEditingBackup(null)
  }

  const handleToggleEdit = (itemId: string) => {
    if (editingItemId === itemId) {
      handleCloseEdit()
      return
    }
    const item = items.find((i) => i.id === itemId)
    if (item) {
      setEditingBackup({ ...item })
      setEditingItemId(itemId)
    }
  }

  const handleFieldChange = <K extends keyof T>(
    itemId: string,
    field: K,
    value: T[K]
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    )
  }

  const handleEscapeEdit = () => {
    if (editingItemId && editingBackup) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId ? { ...editingBackup } : item
        )
      )
    }
    setEditingItemId(null)
    setEditingBackup(null)
  }

  const handleDelete = (itemId: string) => {
    if (!confirm('この項目を削除しますか？')) return
    const filtered = items.filter((i) => i.id !== itemId)
    const updatedItems = filtered.map((i, idx) => ({ ...i, sortOrder: idx }))
    setItems(updatedItems)
  }

  const handleMove = (itemId: string, direction: 'up' | 'down') => {
    const index = items.findIndex((i) => i.id === itemId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newItems = [...items]
    ;[newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ]
    const updatedItems = newItems.map((item, idx) => ({ ...item, sortOrder: idx }))
    setItems(updatedItems)
  }

  return {
    items,
    setItems,
    editingItemId,
    handleAdd,
    handleCloseEdit,
    handleToggleEdit,
    handleFieldChange,
    handleEscapeEdit,
    handleDelete,
    handleMove,
  }
}
