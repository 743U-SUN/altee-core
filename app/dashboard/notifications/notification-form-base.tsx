"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { InlineEdit } from "@/components/inline-edit"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { PRESET_AVATAR } from "@/lib/image-uploader/image-processing-presets"
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import type { UploadedFile } from "@/types/image-upload"

const CONSTRAINTS = {
  TITLE_MAX_LENGTH: 30,
  CONTENT_MAX_LENGTH: 1000,
  URL_PATTERN: /^https:\/\/.+/,
} as const

interface BaseData {
  isEnabled: boolean
  title?: string | null
  content?: string | null
  linkUrl?: string | null
  buttonText?: string | null
  image?: {
    id: string
    originalName: string
    storageKey: string
    mimeType: string
  } | null
}

interface SavePayload {
  isEnabled: boolean
  title?: string | null
  content?: string | null
  linkUrl?: string | null
  buttonText?: string | null
  imageId?: string | null
}

interface NotificationFormBaseProps {
  initialData: BaseData | null
  /** 表示スイッチのラベル */
  enabledLabel: string
  /** 表示スイッチの説明 */
  enabledDescription: string
  /** タイトルのプレースホルダー */
  titlePlaceholder: string
  /** 内容のプレースホルダー */
  contentPlaceholder: string
  /** リンクURLのプレースホルダー */
  linkUrlPlaceholder: string
  /** ボタンテキストのプレースホルダー */
  buttonTextPlaceholder: string
  /** isEnabled変更時のトースト（true/false） */
  enabledToastMessage: [string, string]
  /** 削除確認テキスト */
  deleteConfirmMessage: string
  /** 削除成功テキスト */
  deleteSuccessMessage: string
  /** 画像のフォルダ名 */
  imageFolder: string
  /** リンクURL入力欄の表示制御 */
  showLink?: boolean
  /** ボタンテキスト入力欄の表示制御 */
  showButton?: boolean
  /** 画像アップロード欄の表示制御 */
  showImage?: boolean
  /** コンパクト表示（保存・削除ボタンを非表示） */
  compact?: boolean
  /** Server Action: 更新 */
  onUpdate: (payload: SavePayload) => Promise<{ success: boolean; error?: string }>
  /** Server Action: 削除 */
  onDelete: () => Promise<{ success: boolean; error?: string }>
}

export function NotificationFormBase({
  initialData,
  enabledLabel,
  enabledDescription,
  titlePlaceholder,
  contentPlaceholder,
  linkUrlPlaceholder,
  buttonTextPlaceholder,
  enabledToastMessage,
  deleteConfirmMessage,
  deleteSuccessMessage,
  imageFolder,
  showLink = true,
  showButton = true,
  showImage = true,
  compact = false,
  onUpdate,
  onDelete,
}: NotificationFormBaseProps) {
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
        url: getPublicUrl(initialData.image.storageKey),
        size: 0,
        type: initialData.image.mimeType,
        uploadedAt: new Date().toISOString(),
      }]
      : []
  )

  const buildPayload = (overrides: Partial<SavePayload> = {}): SavePayload => ({
    isEnabled,
    title: title || undefined,
    content: content || undefined,
    linkUrl: linkUrl || undefined,
    buttonText: buttonText || undefined,
    imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
    ...overrides,
  })

  // 画像アップロード/削除時の自動保存
  const handleImageUpload = async (files: UploadedFile[]) => {
    setUploadedFiles(files)
    try {
      const result = await onUpdate(buildPayload({ imageId: files.length > 0 ? files[0].id : undefined }))
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
      const result = await onUpdate(buildPayload({ isEnabled: newIsEnabled }))
      if (result.success) {
        toast.success(newIsEnabled ? enabledToastMessage[0] : enabledToastMessage[1])
      } else {
        toast.error(result.error || "更新に失敗しました")
        setIsEnabled(!newIsEnabled)
      }
    } catch {
      toast.error("設定の保存に失敗しました")
      setIsEnabled(!newIsEnabled)
    }
  }

  // タイトル保存ハンドラ
  const handleTitleSave = async (newTitle: string) => {
    if (newTitle.length > CONSTRAINTS.TITLE_MAX_LENGTH) {
      toast.error(`タイトルは${CONSTRAINTS.TITLE_MAX_LENGTH}文字以内で入力してください`)
      throw new Error("Validation error")
    }
    try {
      const result = await onUpdate(buildPayload({ title: newTitle || undefined }))
      if (result.success) {
        setTitle(newTitle)
        toast.success("タイトルを保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error("タイトルの保存に失敗しました")
      throw error
    }
  }

  // 内容保存ハンドラ
  const handleContentSave = async (newContent: string) => {
    if (newContent.length > CONSTRAINTS.CONTENT_MAX_LENGTH) {
      toast.error(`内容は${CONSTRAINTS.CONTENT_MAX_LENGTH}文字以内で入力してください`)
      throw new Error("Validation error")
    }
    try {
      const result = await onUpdate(buildPayload({ content: newContent || undefined }))
      if (result.success) {
        setContent(newContent)
        toast.success("内容を保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error("内容の保存に失敗しました")
      throw error
    }
  }

  // リンクURL保存ハンドラ
  const handleLinkUrlSave = async (newLinkUrl: string) => {
    if (newLinkUrl && !CONSTRAINTS.URL_PATTERN.test(newLinkUrl)) {
      toast.error("URLはhttps://で始まる必要があります")
      throw new Error("Validation error")
    }
    try {
      const result = await onUpdate(buildPayload({ linkUrl: newLinkUrl || undefined }))
      if (result.success) {
        setLinkUrl(newLinkUrl)
        toast.success("リンクURLを保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error("リンクURLの保存に失敗しました")
      throw error
    }
  }

  // ボタンテキスト保存ハンドラ
  const handleButtonTextSave = async (newButtonText: string) => {
    if (newButtonText.length > 20) {
      toast.error("ボタンテキストは20文字以内で入力してください")
      throw new Error("Validation error")
    }
    try {
      const result = await onUpdate(buildPayload({ buttonText: newButtonText || undefined }))
      if (result.success) {
        setButtonText(newButtonText)
        toast.success("ボタンテキストを保存しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
        throw new Error(result.error)
      }
    } catch (error) {
      toast.error("ボタンテキストの保存に失敗しました")
      throw error
    }
  }

  // まとめて保存ハンドラ
  const handleSaveAll = async () => {
    setIsSubmitting(true)
    try {
      const result = await onUpdate(buildPayload())
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
    if (!confirm(deleteConfirmMessage)) return

    setIsSubmitting(true)
    try {
      const result = await onDelete()
      if (result.success) {
        toast.success(deleteSuccessMessage)
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
      toast.error("削除に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 表示設定 */}
      <div className="flex flex-row items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label className="text-base">{enabledLabel}</Label>
          <p className="text-sm text-muted-foreground">{enabledDescription}</p>
        </div>
        <Switch checked={isEnabled} onCheckedChange={handleIsEnabledChange} />
      </div>

      {isEnabled && (
        <>
          {/* タイトル */}
          <div className="space-y-2">
            <Label>タイトル（任意）</Label>
            <InlineEdit
              value={title}
              onSave={handleTitleSave}
              placeholder={titlePlaceholder}
              maxLength={CONSTRAINTS.TITLE_MAX_LENGTH}
            />
            <p className="text-sm text-muted-foreground">
              最大{CONSTRAINTS.TITLE_MAX_LENGTH}文字
            </p>
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <Label>内容（任意）</Label>
            <InlineEdit
              value={content}
              onSave={handleContentSave}
              placeholder={contentPlaceholder}
              multiline={true}
              maxLength={CONSTRAINTS.CONTENT_MAX_LENGTH}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              最大{CONSTRAINTS.CONTENT_MAX_LENGTH}文字
            </p>
          </div>

          {/* リンクURL */}
          {showLink && (
            <div className="space-y-2">
              <Label>リンクURL（任意）</Label>
              <InlineEdit
                value={linkUrl}
                onSave={handleLinkUrlSave}
                placeholder={linkUrlPlaceholder}
              />
              <p className="text-sm text-muted-foreground">
                ボタンをクリックした際に開くリンクを設定できます
              </p>
            </div>
          )}

          {/* ボタンテキスト */}
          {showButton && linkUrl && (
            <div className="space-y-2">
              <Label>ボタンテキスト</Label>
              <InlineEdit
                value={buttonText}
                onSave={handleButtonTextSave}
                placeholder={buttonTextPlaceholder}
                maxLength={20}
              />
              <p className="text-sm text-muted-foreground">
                ボタンに表示するテキストを設定してください
              </p>
            </div>
          )}

          {/* 画像アップロード */}
          {showImage && (
            <div className="space-y-2">
              <Label>画像（任意）</Label>
              <ImageUploader
                mode="immediate"
                previewSize="medium"
                maxFiles={1}
                folder={imageFolder}
                value={uploadedFiles}
                onUpload={handleImageUpload}
                showPreview={true}
                imageProcessingOptions={PRESET_AVATAR}
              />
              <p className="text-sm text-muted-foreground">
                最大1000px（幅・高さ）の画像をアップロードできます
              </p>
            </div>
          )}
        </>
      )}

      {!compact && (
        <div className="flex gap-4">
          <Button type="button" onClick={handleSaveAll} disabled={isSubmitting}>
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
      )}
    </div>
  )
}
