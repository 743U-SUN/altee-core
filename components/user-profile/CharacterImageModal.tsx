'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { PRESET_PORTRAIT } from '@/lib/image-uploader/image-processing-presets'
import { updateUserProfile } from '@/app/actions/user/profile-actions'
import { toast } from 'sonner'
import { EditModal } from './EditModal'
import type { UploadedFile } from '@/types/image-upload'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Trash2 } from 'lucide-react'

interface CharacterImageModalProps {
  isOpen: boolean
  onClose: () => void
  currentCharacterImageId?: string | null
  currentCharacterImageUrl?: string | null
  currentCharacterBackgroundKey?: string | null
}

/**
 * キャラクター画像・背景画像編集モーダル
 * タブUIで切り替え
 */
export function CharacterImageModal({
  isOpen,
  onClose,
  currentCharacterImageId: _currentCharacterImageId,
  currentCharacterImageUrl,
  currentCharacterBackgroundKey,
}: CharacterImageModalProps) {
  const router = useRouter()
  // キャラクター画像の状態
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 背景画像の状態
  const [backgroundUploadedFiles, setBackgroundUploadedFiles] = useState<UploadedFile[]>([])
  const [isBackgroundSaving, setIsBackgroundSaving] = useState(false)
  const [isBackgroundDeleting, setIsBackgroundDeleting] = useState(false)

  // 背景画像のURL計算
  const currentBackgroundImageUrl = currentCharacterBackgroundKey
    ? getPublicUrl(currentCharacterBackgroundKey)
    : null

  // モーダルが閉じた時に状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setUploadedFiles([])
      setIsSaving(false)
      setIsDeleting(false)
      setBackgroundUploadedFiles([])
      setIsBackgroundSaving(false)
      setIsBackgroundDeleting(false)
    }
  }, [isOpen])

  // キャラクター画像保存処理
  const handleSave = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('画像を選択してください')
      return
    }

    setIsSaving(true)
    try {
      const uploadedFile = uploadedFiles[0]
      const mediaFileId = uploadedFile.id

      const result = await updateUserProfile({
        characterImageId: mediaFileId,
      })

      if (result.success) {
        toast.success('キャラクター画像を更新しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'キャラクター画像の更新に失敗しました')
      }
    } catch {
      toast.error('キャラクター画像の更新中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  // キャラクター画像削除処理
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await updateUserProfile({
        characterImageId: null,
      })

      if (result.success) {
        toast.success('キャラクター画像を削除しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'キャラクター画像の削除に失敗しました')
      }
    } catch {
      toast.error('キャラクター画像の削除中にエラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  // 背景画像保存処理
  const handleBackgroundSave = async () => {
    if (backgroundUploadedFiles.length === 0) {
      toast.error('画像を選択してください')
      return
    }

    setIsBackgroundSaving(true)
    try {
      const uploadedFile = backgroundUploadedFiles[0]
      const storageKey = uploadedFile.key

      const result = await updateUserProfile({
        characterBackgroundKey: storageKey,
      })

      if (result.success) {
        toast.success('背景画像を更新しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || '背景画像の更新に失敗しました')
      }
    } catch {
      toast.error('背景画像の更新中にエラーが発生しました')
    } finally {
      setIsBackgroundSaving(false)
    }
  }

  // 背景画像削除処理
  const handleBackgroundDelete = async () => {
    setIsBackgroundDeleting(true)
    try {
      const result = await updateUserProfile({
        characterBackgroundKey: null,
      })

      if (result.success) {
        toast.success('背景画像を削除しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || '背景画像の削除に失敗しました')
      }
    } catch {
      toast.error('背景画像の削除中にエラーが発生しました')
    } finally {
      setIsBackgroundDeleting(false)
    }
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="画像を変更"
      hideActions
    >
      <Tabs defaultValue="character" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="character">キャラクター画像</TabsTrigger>
          <TabsTrigger value="background">背景画像</TabsTrigger>
        </TabsList>

        {/* キャラクター画像タブ */}
        <TabsContent value="character" className="mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              推奨: 9:16縦長（1080×1920px）
            </p>

            {currentCharacterImageUrl && uploadedFiles.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">現在の画像</p>
                <div className="relative w-32 h-56 mx-auto">
                  <Image
                    src={currentCharacterImageUrl}
                    alt="現在のキャラクター画像"
                    fill
                    sizes="128px"
                    className="rounded-lg object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? '削除中...' : '画像を削除'}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {currentCharacterImageUrl && uploadedFiles.length === 0
                  ? '新しい画像をアップロード'
                  : '画像をアップロード'}
              </p>
              <ImageUploader
                mode="immediate"
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                folder="profile-images"
                previewSize={{ width: 180, height: 320 }}
                rounded={false}
                value={uploadedFiles}
                onUpload={setUploadedFiles}
                imageProcessingOptions={PRESET_PORTRAIT}
              />
            </div>

            {uploadedFiles.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 背景画像タブ */}
        <TabsContent value="background" className="mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              推奨: 16:9（1920×1080px）
            </p>

            {currentBackgroundImageUrl && backgroundUploadedFiles.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">現在の画像</p>
                <div className="relative w-full aspect-video">
                  <Image
                    src={currentBackgroundImageUrl}
                    alt="現在の背景画像"
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="rounded-lg object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={handleBackgroundDelete}
                  disabled={isBackgroundDeleting}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isBackgroundDeleting ? '削除中...' : '背景を削除'}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {currentBackgroundImageUrl && backgroundUploadedFiles.length === 0
                  ? '新しい画像をアップロード'
                  : '画像をアップロード'}
              </p>
              <ImageUploader
                mode="immediate"
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                folder="profile-images"
                previewSize="large"
                rounded={false}
                value={backgroundUploadedFiles}
                onUpload={setBackgroundUploadedFiles}
              />
            </div>

            {backgroundUploadedFiles.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isBackgroundSaving}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button onClick={handleBackgroundSave} disabled={isBackgroundSaving} className="flex-1">
                  {isBackgroundSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </EditModal>
  )
}
