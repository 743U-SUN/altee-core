'use client'

import { useState, useEffect } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { getBackgroundImages, updateUserProfile } from '@/app/actions/user/profile-actions'
import { toast } from 'sonner'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { Check } from 'lucide-react'
import Image from 'next/image'
import { EditModal } from './EditModal'

interface BackgroundImage {
  id: string
  storageKey: string
  fileName: string
  originalName: string
  description: string | null
  altText: string | null
}

interface BannerImageModalProps {
  isOpen: boolean
  onClose: () => void
  currentBackgroundKey?: string | null
}

/**
 * バナー画像編集モーダル
 * 管理者が用意した背景画像一覧から選択
 */
export function BannerImageModal({
  isOpen,
  onClose,
  currentBackgroundKey,
}: BannerImageModalProps) {
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([])
  const [selectedKey, setSelectedKey] = useState<string>(
    currentBackgroundKey || 'none'
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 背景画像一覧を取得
  useEffect(() => {
    if (!isOpen) return

    const fetchBackgroundImages = async () => {
      setIsLoading(true)
      try {
        const result = await getBackgroundImages()
        if (result.success && result.data) {
          setBackgroundImages(result.data)
        } else {
          toast.error(result.error || '背景画像の取得に失敗しました')
        }
      } catch (error) {
        console.error('背景画像取得エラー:', error)
        toast.error('背景画像の取得中にエラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBackgroundImages()
  }, [isOpen])

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateUserProfile({
        backgroundImageKey: selectedKey === 'none' ? null : selectedKey,
      })

      if (result.success) {
        toast.success('バナー画像を更新しました')
        onClose()
      } else {
        toast.error(result.error || 'バナー画像の更新に失敗しました')
      }
    } catch (error) {
      console.error('バナー画像更新エラー:', error)
      toast.error('バナー画像の更新中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <EditModal
        isOpen={isOpen}
        onClose={onClose}
        title="バナー画像を選択"
        hideActions
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </EditModal>
    )
  }

  if (backgroundImages.length === 0) {
    return (
      <EditModal
        isOpen={isOpen}
        onClose={onClose}
        title="バナー画像を選択"
        hideActions
      >
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">
            現在、利用可能なバナー画像はありません
          </p>
        </div>
      </EditModal>
    )
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="バナー画像を選択"
      isSaving={isSaving}
    >
      <RadioGroup value={selectedKey} onValueChange={setSelectedKey}>
        {/* 背景なしオプション */}
        <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
          <RadioGroupItem value="none" id="banner-none" />
          <Label htmlFor="banner-none" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-24 h-16 rounded bg-muted flex items-center justify-center">
                <span className="text-xs text-muted-foreground">なし</span>
              </div>
              <div>
                <p className="font-medium">バナー画像なし</p>
                <p className="text-sm text-muted-foreground">
                  デフォルトの背景を使用します
                </p>
              </div>
            </div>
          </Label>
          {selectedKey === 'none' && <Check className="h-5 w-5 text-primary" />}
        </div>

        {/* 背景画像オプション */}
        {backgroundImages.map((bg) => (
          <div
            key={bg.id}
            className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer"
          >
            <RadioGroupItem
              value={bg.storageKey}
              id={`banner-${bg.storageKey}`}
            />
            <Label
              htmlFor={`banner-${bg.storageKey}`}
              className="flex-1 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-16 rounded overflow-hidden bg-muted">
                  <Image
                    src={getPublicUrl(bg.storageKey)}
                    alt={bg.altText || bg.originalName}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{bg.originalName}</p>
                  {bg.description && (
                    <p className="text-sm text-muted-foreground">
                      {bg.description}
                    </p>
                  )}
                </div>
              </div>
            </Label>
            {selectedKey === bg.storageKey && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </div>
        ))}
      </RadioGroup>
    </EditModal>
  )
}
