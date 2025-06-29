"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { updateUserNotification, deleteUserNotification } from "@/app/actions/notification-actions"
import { NOTIFICATION_CONSTRAINTS } from "@/types/notifications"
import type { UserNotification } from "@/types/notifications"
import type { UploadedFile } from "@/types/image-upload"

// バリデーションスキーマ
const notificationFormSchema = z.object({
  isEnabled: z.boolean(),
  title: z.string()
    .max(NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH, `タイトルは${NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  content: z.string()
    .max(NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH, `内容は${NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH}文字以内で入力してください`)
    .optional(),
  linkUrl: z.string()
    .regex(NOTIFICATION_CONSTRAINTS.URL_PATTERN, "URLはhttps://で始まる必要があります")
    .or(z.literal(""))
    .optional(),
  buttonText: z.string()
    .max(20, "ボタンテキストは20文字以内で入力してください")
    .optional(),
})

type NotificationFormData = z.infer<typeof notificationFormSchema>

interface NotificationSettingsProps {
  initialData: UserNotification | null
}

export function NotificationSettings({ initialData }: NotificationSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const form = useForm<NotificationFormData>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      isEnabled: initialData?.isEnabled ?? false,
      title: initialData?.title ?? "",
      content: initialData?.content ?? "",
      linkUrl: initialData?.linkUrl ?? "",
      buttonText: initialData?.buttonText ?? "",
    },
  })

  const watchLinkUrl = form.watch("linkUrl")
  const watchIsEnabled = form.watch("isEnabled")

  const onSubmit = async (data: NotificationFormData) => {
    setIsSubmitting(true)
    try {
      // linkUrlが空文字の場合はundefinedに変換
      const processedData = {
        ...data,
        linkUrl: data.linkUrl === "" ? undefined : data.linkUrl,
        title: data.title === "" ? undefined : data.title,
        content: data.content === "" ? undefined : data.content,
        buttonText: data.buttonText === "" ? undefined : data.buttonText,
        imageId: uploadedFiles.length > 0 ? uploadedFiles[0].id : undefined,
      }

      const result = await updateUserNotification(processedData)
      
      if (result.success) {
        toast.success("お知らせ設定を更新しました")
      } else {
        toast.error(result.error || "更新に失敗しました")
      }
    } catch {
      toast.error("お知らせ設定の保存に失敗しました")
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
        form.reset({
          isEnabled: false,
          title: "",
          content: "",
          linkUrl: "",
          buttonText: "",
        })
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 表示設定 */}
        <FormField
          control={form.control}
          name="isEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">お知らせを表示する</FormLabel>
                <FormDescription>
                  プロフィールページにお知らせアイコンを表示します
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {watchIsEnabled && (
          <>
            {/* タイトル */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル（任意）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="お知らせのタイトルを入力"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    最大{NOTIFICATION_CONSTRAINTS.TITLE_MAX_LENGTH}文字
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 内容 */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>内容（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="お知らせの内容を入力"
                      className="min-h-[100px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    最大{NOTIFICATION_CONSTRAINTS.CONTENT_MAX_LENGTH}文字
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* リンクURL */}
            <FormField
              control={form.control}
              name="linkUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>リンクURL（任意）</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    ボタンをクリックした際に開くリンクを設定できます
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ボタンテキスト */}
            {watchLinkUrl && (
              <FormField
                control={form.control}
                name="buttonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ボタンテキスト</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="詳細を見る"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      ボタンに表示するテキストを設定してください
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 画像アップロード */}
            <div className="space-y-2">
              <FormLabel>画像（任意）</FormLabel>
              <ImageUploader
                mode="immediate"
                previewSize="medium"
                maxFiles={1}
                folder="user-notifications"
                value={uploadedFiles}
                onUpload={setUploadedFiles}
                onDelete={(fileId) => {
                  setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
                }}
                showPreview={true}
              />
              <FormDescription>
                最大1000px（幅・高さ）の画像をアップロードできます
              </FormDescription>
            </div>
          </>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
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
      </form>
    </Form>
  )
}