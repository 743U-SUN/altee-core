"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { updateLinkType } from "@/app/actions/link-actions"
import { MultipleIconUploadSection } from "./MultipleIconUploadSection"
import type { LinkType } from "@/types/link-type"

interface EditLinkTypeModalProps {
  linkType: LinkType
  onLinkTypeUpdated: (linkType: LinkType) => void
  onCancel: () => void
}

// フォームスキーマ（編集用）
const editLinkTypeFormSchema = z.object({
  displayName: z.string()
    .min(1, "表示名は必須です")
    .max(50, "表示名は50文字以内で入力してください"),
  urlPattern: z.string()
    .max(200, "URLパターンは200文字以内で入力してください")
    .optional(),
  isActive: z.boolean(),
})

type EditLinkTypeFormData = z.infer<typeof editLinkTypeFormSchema>

export function EditLinkTypeModal({ linkType, onLinkTypeUpdated, onCancel }: EditLinkTypeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditLinkTypeFormData>({
    resolver: zodResolver(editLinkTypeFormSchema),
    defaultValues: {
      displayName: linkType.displayName,
      urlPattern: linkType.urlPattern || "",
      isActive: linkType.isActive,
    },
  })

  const onSubmit = async (data: EditLinkTypeFormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateLinkType(linkType.id, {
        displayName: data.displayName,
        urlPattern: data.urlPattern || undefined,
        isActive: data.isActive,
      })

      if (result.success && result.data) {
        toast.success("リンクタイプを更新しました")
        onLinkTypeUpdated(result.data as LinkType)
      } else {
        toast.error(result.error || "リンクタイプの更新に失敗しました")
      }
    } catch {
      toast.error("リンクタイプの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>リンクタイプを編集</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 識別名表示（編集不可） */}
            <div className="space-y-2">
              <Label>識別名</Label>
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                <code className="font-medium">{linkType.name}</code>
                <span className="text-xs text-muted-foreground">（変更不可）</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表示名</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: YouTube, Instagram" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urlPattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    URLパターン <span className="text-sm text-muted-foreground">（正規表現、オプション）</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="例: ^https://(www\\.)?(youtube\\.com|youtu\\.be).*"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 複数アイコン管理機能 */}
            <MultipleIconUploadSection
              linkTypeId={linkType.id}
              initialIcons={linkType.icons}
              onIconsChanged={(icons) => {
                // アイコンが変更された場合の処理（必要に応じて）
                console.log("Icons updated:", icons)
              }}
            />

            {/* カスタムタイプ表示（編集不可） */}
            <div className="space-y-2">
              <Label>タイプ</Label>
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                <span className="font-medium">
                  {linkType.isCustom ? "カスタムリンク" : "プリセットリンク"}
                </span>
                <span className="text-xs text-muted-foreground">（変更不可）</span>
              </div>
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">有効状態</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      ユーザーが選択できるかどうか
                      {(linkType._count?.userLinks || 0) > 0 && (
                        <div className="text-xs text-orange-600 mt-1">
                          現在 {linkType._count?.userLinks} 個のリンクで使用中
                        </div>
                      )}
                    </div>
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "更新中..." : "更新"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}