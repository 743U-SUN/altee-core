"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createLinkType } from "@/app/actions/link-actions"

// フォームスキーマ
const linkTypeFormSchema = z.object({
  name: z.string()
    .min(1, "名前は必須です")
    .max(50, "名前は50文字以内で入力してください")
    .regex(/^[a-z0-9-_]+$/, "名前は英小文字、数字、ハイフン、アンダースコアのみ使用可能です"),
  displayName: z.string()
    .min(1, "表示名は必須です")
    .max(50, "表示名は50文字以内で入力してください"),
  urlPattern: z.string()
    .max(200, "URLパターンは200文字以内で入力してください")
    .optional()
    .or(z.literal("")),
  isCustom: z.boolean()
    .default(false),
  isActive: z.boolean()
    .default(true),
})

interface AddLinkTypeModalProps {
  linkTypes: Array<{ id: string; isCustom: boolean }>
  onLinkTypeAdded?: () => void
}

export function AddLinkTypeModal({ linkTypes, onLinkTypeAdded }: AddLinkTypeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 既存のカスタムリンクタイプがあるかチェック
  const hasCustomLinkType = linkTypes.some(lt => lt.isCustom)

  const form = useForm({
    resolver: zodResolver(linkTypeFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      urlPattern: "",
      isCustom: false,
      isActive: true,
    },
  })

  const onSubmit = async (data: z.infer<typeof linkTypeFormSchema>) => {
    setIsSubmitting(true)
    try {
      const result = await createLinkType({
        ...data,
        sortOrder: 0, // デフォルト値、Server Actionで適切な値に変更される
      })

      if (result.success) {
        toast.success("リンクタイプを追加しました")
        form.reset()
        setIsOpen(false)
        // 親コンポーネントに更新を通知（window.location.reload()を削除）
        onLinkTypeAdded?.()
      } else {
        toast.error(result.error || "リンクタイプの追加に失敗しました")
      }
    } catch {
      toast.error("リンクタイプの追加に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          リンクタイプを追加
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>新しいリンクタイプを追加</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    識別名 <span className="text-sm text-muted-foreground">（システム内部用）</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: youtube, instagram" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* アイコン管理の説明 */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">📌 アイコン管理について</p>
                <p>リンクタイプを作成した後、編集画面で複数のアイコンを追加・管理できます。</p>
                <p>デフォルトアイコン、カスタムアイコンなど様々なオプションを設定可能です。</p>
              </div>
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isCustom"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">カスタムリンク</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        ユーザーが自由にラベルを設定できるタイプ
                        {hasCustomLinkType && (
                          <span className="block text-xs text-amber-600 mt-1">
                            ※ カスタムリンクタイプは既に存在します
                          </span>
                        )}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={hasCustomLinkType}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">有効状態</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        ユーザーが選択できるかどうか
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
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsOpen(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "追加中..." : "追加"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}