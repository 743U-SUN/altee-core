'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateSection } from '@/app/actions/user/section-actions'
import { deleteImageAction } from '@/app/actions/media/image-upload-actions'
import { toast } from 'sonner'
import type { ImageHeroData, ImageGridItem } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { nanoid } from 'nanoid'

interface ImageHeroEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: ImageHeroData
}

export function ImageHeroEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: ImageHeroEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // アイテムの状態
  const [item, setItem] = useState<ImageGridItem>(() => ({
    id: currentData.item?.id || nanoid(),
    imageKey: currentData.item?.imageKey,
    title: currentData.item?.title || '',
    subtitle: currentData.item?.subtitle || '',
    overlayText: currentData.item?.overlayText || '',
    linkUrl: currentData.item?.linkUrl || '',
    sortOrder: 0,
  }))

  // 画像アップロード用の値
  const uploadValue = useMemo<UploadedFile[]>(() => {
    if (!item.imageKey) return []
    return [{
      id: item.id,
      name: item.imageKey,
      originalName: item.imageKey,
      url: `/api/files/${item.imageKey}`,
      key: item.imageKey,
      size: 0,
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
    }]
  }, [item.imageKey, item.id])

  // 画像アップロード完了
  const handleUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setItem(prev => ({ ...prev, imageKey: files[0].key }))
    }
  }

  // 画像削除
  const handleDelete = async (fileId: string) => {
    const file = uploadValue.find(f => f.id === fileId)
    if (file && file.key) {
      await deleteImageAction(file.key)
    }
    setItem(prev => ({ ...prev, imageKey: undefined }))
  }

  // 保存処理
  const handleSave = () => {
    startTransition(async () => {
      try {
        const newData: ImageHeroData = { item }
        const result = await updateSection(sectionId, { data: newData })

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
  }

  return (
    <EditModal isOpen={isOpen} onClose={onClose} title="ヒーロー画像を編集" hideActions>
      <div className="space-y-6">
        {/* 画像アップロード */}
        <div className="space-y-2">
          <Label>画像</Label>
          <ImageUploader
            mode="immediate"
            previewSize={{ width: 400, height: 171 }}
            maxFiles={1}
            folder="section-images"
            value={uploadValue}
            onUpload={handleUpload}
            onDelete={handleDelete}
          />
          <p className="text-xs text-muted-foreground">
            推奨サイズ: 21:9（例: 2100x900px）
          </p>
        </div>

        {/* タイトル */}
        <div className="space-y-2">
          <Label htmlFor="hero-title">タイトル（左下）</Label>
          <Input
            id="hero-title"
            value={item.title}
            onChange={(e) => setItem(prev => ({ ...prev, title: e.target.value }))}
            placeholder="タイトルを入力"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground text-right">
            {item.title?.length || 0}/30
          </p>
        </div>

        {/* サブタイトル（左下バッジ） */}
        <div className="space-y-2">
          <Label htmlFor="hero-subtitle">サブタイトル（左下バッジ）</Label>
          <Input
            id="hero-subtitle"
            value={item.subtitle}
            onChange={(e) => setItem(prev => ({ ...prev, subtitle: e.target.value }))}
            placeholder="サブタイトルを入力"
            maxLength={20}
          />
          <p className="text-xs text-muted-foreground text-right">
            {item.subtitle?.length || 0}/20
          </p>
        </div>

        {/* 右上バッジ */}
        <div className="space-y-2">
          <Label htmlFor="hero-overlay">右上バッジ</Label>
          <Input
            id="hero-overlay"
            value={item.overlayText}
            onChange={(e) => setItem(prev => ({ ...prev, overlayText: e.target.value }))}
            placeholder="右上に表示するテキスト"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground text-right">
            {item.overlayText?.length || 0}/15
          </p>
        </div>

        {/* リンクURL */}
        <div className="space-y-2">
          <Label htmlFor="hero-link">リンクURL</Label>
          <Input
            id="hero-link"
            type="url"
            value={item.linkUrl}
            onChange={(e) => setItem(prev => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="https://example.com"
          />
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="flex-1">
            {isPending ? '処理中...' : '完了'}
          </Button>
        </div>
      </div>
    </EditModal>
  )
}
