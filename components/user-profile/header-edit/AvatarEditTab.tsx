'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { PRESET_AVATAR } from '@/lib/image-uploader/image-processing-presets'
import { updateUserProfile } from '@/app/actions/user/profile-actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import type { UploadedFile } from '@/types/image-upload'

interface AvatarEditTabProps {
  isOpen: boolean
  onClose: () => void
  currentAvatarImageUrl?: string | null
}

export function AvatarEditTab({
  isOpen,
  onClose,
  currentAvatarImageUrl,
}: AvatarEditTabProps) {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // モーダルが閉じた時に状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setUploadedFiles([])
      setIsSaving(false)
      setIsDeleting(false)
    }
  }, [isOpen])

  const handleSave = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('画像を選択してください')
      return
    }
    setIsSaving(true)
    try {
      const result = await updateUserProfile({
        iconImageKey: uploadedFiles[0].key,
      })
      if (result.success) {
        toast.success('アイコンを更新しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'アイコンの更新に失敗しました')
      }
    } catch {
      toast.error('アイコンの更新中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await updateUserProfile({ iconImageKey: null })
      if (result.success) {
        toast.success('アイコンを削除しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'アイコンの削除に失敗しました')
      }
    } catch {
      toast.error('アイコンの削除中にエラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        推奨: 500×500px 正方形
      </p>

      {currentAvatarImageUrl && uploadedFiles.length === 0 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">現在のアイコン</p>
          <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden">
            <Image
              src={currentAvatarImageUrl}
              alt="現在のアイコン"
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isDeleting ? '削除中...' : 'アイコンを削除'}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          {currentAvatarImageUrl && uploadedFiles.length === 0
            ? '新しいアイコンをアップロード'
            : 'アイコンをアップロード'}
        </p>
        <ImageUploader
          mode="immediate"
          maxFiles={1}
          maxSize={5 * 1024 * 1024}
          folder="user-icons"
          previewSize={{ width: 80, height: 80 }}
          rounded={true}
          value={uploadedFiles}
          onUpload={setUploadedFiles}
          imageProcessingOptions={PRESET_AVATAR}
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
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      )}
    </div>
  )
}
