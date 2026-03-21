"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { InlineEdit } from "@/components/inline-edit"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { PRESET_AVATAR } from "@/lib/image-uploader/image-processing-presets"
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { updateUserGift, deleteUserGift } from "@/app/actions/user/gift-actions"
import type { UserGift } from "@/types/gift"
import type { UploadedFile } from "@/types/image-upload"

interface GiftSettingsProps {
  initialData: UserGift | null
  compact?: boolean  // モーダル表示時はtrue
}

export function GiftSettings({ initialData, compact = false }: GiftSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEnabled, setIsEnabled] = useState(initialData?.isEnabled ?? false)
  const [linkUrl, setLinkUrl] = useState(initialData?.linkUrl ?? '')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialData?.image
      ? [{
          id: initialData.image.id,
          name: initialData.image.originalName,
          originalName: initialData.image.originalName,
          key: initialData.image.storageKey,
          url: getPublicUrl(initialData.image.storageKey),
          size: 0,
          type: initialData.image.mimeType,
          uploadedAt: new Date().toISOString(),
        }]
      : []
  )

  // 画像アップロード/削除時の自動保存
  const handleImageUpload = async (files: UploadedFile[]) => {
    setUploadedFiles(files)

    try {
      const result = await updateUserGift({
        isEnabled,
        linkUrl: linkUrl.trim() || undefined,
        imageId: files.length > 0 ? files[0].id : undefined,
      })

      if (result.success) {
        toast.success(files.length > 0 ? '画像を保存しました' : '画像を削除しました')
      } else {
        toast.error(result.error || '更新に失敗しました')
      }
    } catch {
      toast.error('画像の保存に失敗しました')
    }
  }

  // isEnabled切り替え時の自動保存
  const handleIsEnabledChange = async (newIsEnabled: boolean) => {
    setIsEnabled(newIsEnabled)

    try {
      const result = await updateUserGift({
        isEnabled: newIsEnabled,
        linkUrl: linkUrl.trim() || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        toast.success(newIsEnabled ? 'ギフト設定を表示に設定しました' : 'ギフト設定を非表示に設定しました')
      } else {
        toast.error(result.error || '更新に失敗しました')
        setIsEnabled(!newIsEnabled)
      }
    } catch {
      toast.error('設定の保存に失敗しました')
      setIsEnabled(!newIsEnabled)
    }
  }

  // リンクURL保存ハンドラ
  const handleLinkUrlSave = async (newLinkUrl: string) => {
    const trimmedUrl = newLinkUrl.trim()

    // バリデーション
    if (trimmedUrl && !/^https:\/\/.+/.test(trimmedUrl)) {
      toast.error('URLはhttps://で始まる必要があります')
      throw new Error('Validation error')
    }

    try {
      const result = await updateUserGift({
        isEnabled,
        linkUrl: trimmedUrl || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        setLinkUrl(trimmedUrl)
        toast.success('リンクURLを保存しました')
      } else {
        toast.error(result.error || '更新に失敗しました')
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error('リンクURLの保存に失敗しました')
      throw error
    }
  }

  // まとめて保存ハンドラ（明示的な保存ボタン用）
  const handleSaveAll = async () => {
    setIsSubmitting(true)
    try {
      const result = await updateUserGift({
        isEnabled,
        linkUrl: linkUrl.trim() || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        toast.success('設定を保存しました')
      } else {
        toast.error(result.error || '保存に失敗しました')
      }
    } catch {
      toast.error('設定の保存に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true)
    try {
      const result = await deleteUserGift()

      if (result.success) {
        toast.success('ギフト設定を削除しました')
        setIsEnabled(false)
        setLinkUrl('')
        setUploadedFiles([])
      } else {
        toast.error(result.error || '削除に失敗しました')
      }
    } catch {
      toast.error('ギフト設定の削除に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 表示設定 */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">ギフト設定を表示する</Label>
          <p className="text-sm text-muted-foreground">
            プロフィールページにギフトアイコンを表示します
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleIsEnabledChange}
        />
      </div>

      {isEnabled && (
        <>
          {/* 画像アップロード */}
          <div className="space-y-2">
            <Label>ギフト画像（任意）</Label>
            <ImageUploader
              mode="immediate"
              previewSize="medium"
              maxFiles={1}
              folder="user-gifts"
              value={uploadedFiles}
              onUpload={handleImageUpload}
              showPreview={true}
              imageProcessingOptions={PRESET_AVATAR}
            />
            <p className="text-sm text-muted-foreground">
              ギフトページで表示する画像をアップロードできます
            </p>
          </div>

          {/* リンクURL */}
          <div className="space-y-2">
            <Label>リンクURL（任意）</Label>
            <InlineEdit
              value={linkUrl}
              onSave={handleLinkUrlSave}
              placeholder="https://example.com/gift"
            />
            <p className="text-sm text-muted-foreground">
              ギフトページへのリンクを設定できます
            </p>
          </div>
        </>
      )}

      {!compact && (
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={handleSaveAll}
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : '設定を保存'}
          </Button>

          {initialData && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isSubmitting}
            >
              設定を削除
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ギフト設定を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
