"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { InlineEdit } from "@/components/ui/inline-edit"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { updateUserNotification, deleteUserNotification } from "@/app/actions/notification-actions"
import { NOTIFICATION_CONSTRAINTS } from "@/types/notifications"
import type { UserNotification } from "@/types/notifications"
import type { UploadedFile } from "@/types/image-upload"

interface NotificationSettingsProps {
  initialData: UserNotification | null
}

export function NotificationSettings({ initialData }: NotificationSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEnabled, setIsEnabled] = useState(initialData?.isEnabled ?? false)
  const [title, setTitle] = useState(initialData?.title ?? "")
  const [content, setContent] = useState(initialData?.content ?? "")
  const [linkUrl, setLinkUrl] = useState(initialData?.linkUrl ?? "")
  const [buttonText, setButtonText] = useState(initialData?.buttonText ?? "")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(
    initialData?.image
      ? [{
          id: initialData.image.id,
          name: initialData.image.originalName,
          originalName: initialData.image.originalName,
          key: initialData.image.storageKey,
          url: `/api/files/${initialData.image.storageKey}`,
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
      const result = await updateUserNotification({
        isEnabled,
        title: title || undefined,
        content: content || undefined,
        linkUrl: linkUrl || undefined,
        buttonText: buttonText || undefined,
        imageId: files.length > 0 ? files[0].id : undefined,
      })

      if (result.success) {
        toast.success(files.length > 0 ? "画像を保存しました" : "画像を削除しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
      }
    } catch {
      toast.error("画像の保存に失敗しました")
    }
  }

  // isEnabled切り替え時の自動保存
  const handleIsEnabledChange = async (newIsEnabled: boolean) => {
    setIsEnabled(newIsEnabled)

    try {
      const result = await updateUserNotification({
        isEnabled: newIsEnabled,
        title: title || undefined,
        content: content || undefined,
        linkUrl: linkUrl || undefined,
        buttonText: buttonText || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        toast.success(newIsEnabled ? "お知らせを表示に設定しました" : "お知らせを非表示に設定しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        // エラー時は元に戻す
        setIsEnabled(!newIsEnabled)
      }
    } catch {
      toast.error("設定の保存に失敗しました")
      // エラー時は元に戻す
      setIsEnabled(!newIsEnabled)
    }
  }

  // タイトル保存ハンドラ
  const handleTitleSave = async (newTitle: string) => {
    // バリデーション
    if (newTitle.length > NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH) {
      toast.error(`タイトルは${NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH}文字以内で入力してください`)
      throw new Error("Validation error")
    }

    try {
      const result = await updateUserNotification({
        isEnabled,
        title: newTitle || undefined,
        content: content || undefined,
        linkUrl: linkUrl || undefined,
        buttonText: buttonText || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        setTitle(newTitle)
        toast.success("タイトルを保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("タイトル保存エラー:", error)
      toast.error("タイトルの保存に失敗しました")
      throw error
    }
  }

  // 内容保存ハンドラ
  const handleContentSave = async (newContent: string) => {
    // バリデーション
    if (newContent.length > NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH) {
      toast.error(`内容は${NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH}文字以内で入力してください`)
      throw new Error("Validation error")
    }

    try {
      const result = await updateUserNotification({
        isEnabled,
        title: title || undefined,
        content: newContent || undefined,
        linkUrl: linkUrl || undefined,
        buttonText: buttonText || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        setContent(newContent)
        toast.success("内容を保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("内容保存エラー:", error)
      toast.error("内容の保存に失敗しました")
      throw error
    }
  }

  // リンクURL保存ハンドラ
  const handleLinkUrlSave = async (newLinkUrl: string) => {
    // バリデーション
    if (newLinkUrl && !NOTIFICATION_CONSTRAINTS.URL_PATTERN.test(newLinkUrl)) {
      toast.error("URLはhttps://で始まる必要があります")
      throw new Error("Validation error")
    }

    try {
      const result = await updateUserNotification({
        isEnabled,
        title: title || undefined,
        content: content || undefined,
        linkUrl: newLinkUrl || undefined,
        buttonText: buttonText || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        setLinkUrl(newLinkUrl)
        toast.success("リンクURLを保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("リンクURL保存エラー:", error)
      toast.error("リンクURLの保存に失敗しました")
      throw error
    }
  }

  // ボタンテキスト保存ハンドラ
  const handleButtonTextSave = async (newButtonText: string) => {
    // バリデーション
    if (newButtonText.length > 20) {
      toast.error("ボタンテキストは20文字以内で入力してください")
      throw new Error("Validation error")
    }

    try {
      const result = await updateUserNotification({
        isEnabled,
        title: title || undefined,
        content: content || undefined,
        linkUrl: linkUrl || undefined,
        buttonText: newButtonText || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        setButtonText(newButtonText)
        toast.success("ボタンテキストを保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("ボタンテキスト保存エラー:", error)
      toast.error("ボタンテキストの保存に失敗しました")
      throw error
    }
  }

  // まとめて保存ハンドラ（明示的な保存ボタン用）
  const handleSaveAll = async () => {
    setIsSubmitting(true)
    try {
      const result = await updateUserNotification({
        isEnabled,
        title: title || undefined,
        content: content || undefined,
        linkUrl: linkUrl || undefined,
        buttonText: buttonText || undefined,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      })

      if (result.success) {
        toast.success("設定を保存しました")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch {
      toast.error("設定の保存に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("お知らせ設定を削除しますか？この操作は取り消せません。")) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await deleteUserNotification()

      if (result.success) {
        toast.success("お知らせ設定を削除しました")
        setIsEnabled(false)
        setTitle("")
        setContent("")
        setLinkUrl("")
        setButtonText("")
        setUploadedFiles([])
      } else {
        toast.error(result.error || "削除に失敗しました")
      }
    } catch {
      toast.error("お知らせ設定の削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 表示設定 */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">お知らせを表示する</Label>
          <p className="text-sm text-muted-foreground">
            プロフィールページにお知らせアイコンを表示します
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleIsEnabledChange}
        />
      </div>

      {isEnabled && (
        <>
          {/* タイトル */}
          <div className="space-y-2">
            <Label>タイトル（任意）</Label>
            <InlineEdit
              value={title}
              onSave={handleTitleSave}
              placeholder="お知らせのタイトルを入力"
              maxLength={NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH}
            />
            <p className="text-sm text-muted-foreground">
              最大{NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH}文字
            </p>
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label>内容（任意）</Label>
            <InlineEdit
              value={content}
              onSave={handleContentSave}
              placeholder="お知らせの内容を入力"
              multiline={true}
              maxLength={NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              最大{NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH}文字
            </p>
          </div>

          {/* リンクURL */}
          <div className="space-y-2">
            <Label>リンクURL（任意）</Label>
            <InlineEdit
              value={linkUrl}
              onSave={handleLinkUrlSave}
              placeholder="https://example.com"
            />
            <p className="text-sm text-muted-foreground">
              ボタンをクリックした際に開くリンクを設定できます
            </p>
          </div>

          {/* ボタンテキスト */}
          {linkUrl && (
            <div className="space-y-2">
              <Label>ボタンテキスト</Label>
              <InlineEdit
                value={buttonText}
                onSave={handleButtonTextSave}
                placeholder="詳細を見る"
                maxLength={20}
              />
              <p className="text-sm text-muted-foreground">
                ボタンに表示するテキストを設定してください
              </p>
            </div>
          )}

          {/* 画像アップロード */}
          <div className="space-y-2">
            <Label>画像（任意）</Label>
            <ImageUploader
              mode="immediate"
              previewSize="medium"
              maxFiles={1}
              folder="user-notifications"
              value={uploadedFiles}
              onUpload={handleImageUpload}
              showPreview={true}
            />
            <p className="text-sm text-muted-foreground">
              最大1000px（幅・高さ）の画像をアップロードできます
            </p>
          </div>
        </>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          onClick={handleSaveAll}
          disabled={isSubmitting}
        >
          {isSubmitting ? "保存中..." : "設定を保存"}
        </Button>

        {initialData && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            設定を削除
          </Button>
        )}
      </div>
    </div>
  )
}
