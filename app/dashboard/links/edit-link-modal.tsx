"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ExternalLink } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { updateUserLink } from "@/app/actions/link-actions"

// 型定義
interface LinkType {
  id: string
  name: string
  displayName: string
  defaultIcon?: string | null
  isCustom: boolean
  urlPattern?: string | null
}

interface UserLink {
  id: string
  url: string
  customLabel?: string | null
  isVisible: boolean
  sortOrder: number
  linkType: {
    id: string
    name: string
    displayName: string
    defaultIcon?: string | null
    isCustom: boolean
  }
  customIcon?: {
    id: string
    storageKey: string
    fileName: string
  } | null
}

interface EditLinkModalProps {
  link: UserLink
  linkTypes?: LinkType[]
  onLinkUpdated: (link: UserLink) => void
  onCancel: () => void
}

// フォームスキーマ（編集用）
const editLinkFormSchema = z.object({
  url: z.string()
    .url("有効なURLを入力してください")
    .refine((url) => url.startsWith("https://"), {
      message: "HTTPSのURLを入力してください"
    }),
  customLabel: z.string()
    .max(10, "カスタムラベルは10文字以内で入力してください")
    .optional(),
  isVisible: z.boolean(),
})

type EditLinkFormData = z.infer<typeof editLinkFormSchema>

export function EditLinkModal({ link, onLinkUpdated, onCancel }: EditLinkModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<EditLinkFormData>({
    resolver: zodResolver(editLinkFormSchema),
    defaultValues: {
      url: link.url,
      customLabel: link.customLabel || "",
      isVisible: link.isVisible,
    },
  })

  const onSubmit = async (data: EditLinkFormData) => {
    setIsSubmitting(true)
    try {
      const result = await updateUserLink(link.id, {
        url: data.url,
        customLabel: data.customLabel || undefined,
        isVisible: data.isVisible,
      })

      if (result.success && result.data) {
        onLinkUpdated(result.data)
        toast.success("リンクを更新しました")
      } else {
        toast.error(result.error || "リンクの更新に失敗しました")
      }
    } catch {
      toast.error("リンクの更新に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getIconUrl = () => {
    if (link.customIcon) {
      return `https://object-storage.c3j1.conoha.io/v1/AUTH_0bf5238d06034983a552682e781f9e25/${link.customIcon.storageKey}`
    }
    if (link.linkType.defaultIcon) {
      return `https://object-storage.c3j1.conoha.io/v1/AUTH_0bf5238d06034983a552682e781f9e25/${link.linkType.defaultIcon}`
    }
    return null
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* リンクタイプ表示（編集不可） */}
        <div className="space-y-2">
          <Label>サービス</Label>
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
            {getIconUrl() ? (
              <Image
                src={getIconUrl()!} 
                alt={link.linkType.displayName}
                width={16}
                height={16}
                className="object-contain"
                unoptimized
              />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            <span className="font-medium">
              {link.customLabel && link.linkType.isCustom 
                ? link.customLabel 
                : link.linkType.displayName
              }
            </span>
            <span className="text-xs text-muted-foreground">（変更不可）</span>
          </div>
        </div>

        {/* カスタムラベル（カスタムリンクの場合のみ） */}
        {link.linkType.isCustom && (
          <FormField
            control={form.control}
            name="customLabel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ラベル名 <span className="text-sm text-muted-foreground">（最大10文字）</span></FormLabel>
                <FormControl>
                  <Input 
                    placeholder="例: 個人サイト" 
                    maxLength={10}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL <span className="text-sm text-muted-foreground">（HTTPS必須）</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com" 
                  type="url"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isVisible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <FormLabel className="text-base">公開設定</FormLabel>
                <div className="text-sm text-muted-foreground">
                  プロフィールページでこのリンクを表示するかどうか
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
  )
}