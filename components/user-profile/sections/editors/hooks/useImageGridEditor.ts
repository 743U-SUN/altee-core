import { useState, useMemo, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import { updateSection } from '@/app/actions/user/section-actions'
import { deleteImageAction } from '@/app/actions/media/image-upload-actions'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import type { ImageGridItem } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'

interface UseImageGridEditorOptions {
  sectionId: string
  initialItems: ImageGridItem[]
  itemCount: number
  onClose: () => void
}

function createDefaultItem(sortOrder: number): ImageGridItem {
  return {
    id: nanoid(),
    imageKey: undefined,
    title: '',
    subtitle: '',
    overlayText: '',
    linkUrl: '',
    sortOrder,
  }
}

/**
 * ImageGrid編集モーダル用の共通フック
 * ImageGrid2EditModal, ImageGrid3EditModalで使用
 */
export function useImageGridEditor({
  sectionId,
  initialItems,
  itemCount,
  onClose,
}: UseImageGridEditorOptions) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // アイテムの状態を初期化
  const [items, setItems] = useState<ImageGridItem[]>(() => {
    return Array.from({ length: itemCount }, (_, i) => {
      const existing = initialItems[i]
      return existing
        ? { ...existing, id: existing.id || nanoid() }
        : createDefaultItem(i)
    })
  })

  // sortOrderでソートした表示用アイテム
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [items])

  // アイテム更新
  const updateItem = useCallback((id: string, updates: Partial<ImageGridItem>) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, ...updates } : item))
    )
  }, [])

  // 並べ替え
  const handleMove = useCallback((id: string, direction: 'left' | 'right') => {
    setItems(prev => {
      const sorted = [...prev].sort((a, b) => a.sortOrder - b.sortOrder)
      const index = sorted.findIndex(item => item.id === id)

      if (direction === 'left' && index === 0) return prev
      if (direction === 'right' && index === sorted.length - 1) return prev

      const targetIndex = direction === 'left' ? index - 1 : index + 1
      const newSorted = [...sorted]
      ;[newSorted[index], newSorted[targetIndex]] = [
        newSorted[targetIndex],
        newSorted[index],
      ]

      return newSorted.map((item, idx) => ({ ...item, sortOrder: idx }))
    })
  }, [])

  // 画像アップロード用の値を取得
  const getUploadValue = useCallback((item: ImageGridItem): UploadedFile[] => {
    if (!item.imageKey) return []
    return [
      {
        id: item.id,
        name: item.imageKey,
        originalName: item.imageKey,
        url: getPublicUrl(item.imageKey),
        key: item.imageKey,
        size: 0,
        type: 'image/jpeg',
        uploadedAt: new Date().toISOString(),
      },
    ]
  }, [])

  // 画像アップロード完了
  const handleUpload = useCallback((itemId: string, files: UploadedFile[]) => {
    if (files.length > 0) {
      updateItem(itemId, { imageKey: files[0].key })
    }
  }, [updateItem])

  // 画像削除
  const handleDelete = useCallback(async (itemId: string) => {
    const item = items.find(i => i.id === itemId)
    if (item?.imageKey) {
      await deleteImageAction(item.imageKey)
    }
    updateItem(itemId, { imageKey: undefined })
  }, [items, updateItem])

  // 保存処理
  const handleSave = useCallback(() => {
    startTransition(async () => {
      try {
        const sortedForSave = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
        const result = await updateSection(sectionId, { data: { items: sortedForSave } })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '更新に失敗しました')
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
      }
    })
  }, [items, sectionId, onClose, router])

  return {
    items,
    sortedItems,
    isPending,
    updateItem,
    handleMove,
    getUploadValue,
    handleUpload,
    handleDelete,
    handleSave,
  }
}
