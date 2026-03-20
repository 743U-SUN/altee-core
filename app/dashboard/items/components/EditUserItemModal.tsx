'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateUserItem } from "@/app/actions/content/item-actions"
import { UserItemWithDetails } from "@/types/item"
import { ItemImage } from "@/components/items/item-image"

const userItemSchema = z.object({
  isPublic: z.boolean(),
  review: z.string().optional(),
})

interface EditUserItemModalProps {
  isOpen: boolean
  onClose: () => void
  userItem: UserItemWithDetails
  onUpdate: (updatedUserItem: UserItemWithDetails) => void
}

export function EditUserItemModal({
  isOpen,
  onClose,
  userItem,
  onUpdate
}: EditUserItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof userItemSchema>>({
    resolver: zodResolver(userItemSchema),
    defaultValues: {
      isPublic: userItem.isPublic,
      review: userItem.review || '',
    }
  })

  const onSubmit = async (data: z.infer<typeof userItemSchema>) => {
    setIsSubmitting(true)
    try {
      const result = await updateUserItem(userItem.id, data)

      if (result.success) {
        toast.success('アイテム情報を更新しました')
        // 更新されたデータで親コンポーネントに通知
        const updatedUserItem = {
          ...userItem,
          isPublic: data.isPublic,
          review: data.review || null,
        }
        onUpdate(updatedUserItem)
        onClose()
      } else {
        toast.error(result.error || 'アイテム情報の更新に失敗しました')
      }
    } catch {
      toast.error('更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>アイテム情報の編集</DialogTitle>
          <DialogDescription>
            公開設定やレビュー内容を編集できます。
          </DialogDescription>
        </DialogHeader>

        {/* アイテム情報表示 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {userItem.item.category.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <ItemImage
                imageStorageKey={userItem.item.imageStorageKey}
                customImageUrl={userItem.item.customImageUrl}
                amazonImageUrl={userItem.item.amazonImageUrl}
                alt={userItem.item.name}
                width={80}
                height={80}
                className="w-20 h-20 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base leading-tight">
                  {userItem.item.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ASIN: {userItem.item.asin}
                </p>
                {userItem.item.ogDescription && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {userItem.item.ogDescription}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 公開設定 */}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      公開設定
                    </FormLabel>
                    <FormDescription>
                      このアイテムを他のユーザーに公開しますか？
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

            {/* レビュー */}
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>レビュー・感想</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="使用感や感想を詳しく..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    他のユーザーの参考になる情報を書いてみてください
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 登録日表示 */}
            <div className="text-sm text-muted-foreground border-t pt-4">
              登録日: {new Date(userItem.createdAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>

            <div className="flex justify-between pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                更新
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
