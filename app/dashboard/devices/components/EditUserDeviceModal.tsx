'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { updateUserDevice } from "@/app/actions/device-actions"
import { UserDeviceWithDetails } from "@/types/device"
import { DeviceImage } from "@/components/devices/device-image"

const userDeviceSchema = z.object({
  isPublic: z.boolean(),
  review: z.string().optional(),
})

interface EditUserDeviceModalProps {
  isOpen: boolean
  onClose: () => void
  userDevice: UserDeviceWithDetails
  userId: string
  onUpdate: (updatedUserDevice: UserDeviceWithDetails) => void
}

export function EditUserDeviceModal({ 
  isOpen, 
  onClose, 
  userDevice, 
  userId, 
  onUpdate 
}: EditUserDeviceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof userDeviceSchema>>({
    resolver: zodResolver(userDeviceSchema),
    defaultValues: {
      isPublic: userDevice.isPublic,
      review: userDevice.review || '',
    }
  })

  const onSubmit = async (data: z.infer<typeof userDeviceSchema>) => {
    setIsSubmitting(true)
    try {
      const result = await updateUserDevice(userId, userDevice.id, data)

      if (result.success) {
        toast.success('デバイス情報を更新しました')
        // 更新されたデータで親コンポーネントに通知
        const updatedUserDevice = {
          ...userDevice,
          isPublic: data.isPublic,
          review: data.review || null,
        }
        onUpdate(updatedUserDevice)
        onClose()
      } else {
        toast.error(result.error || 'デバイス情報の更新に失敗しました')
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
          <DialogTitle>デバイス情報の編集</DialogTitle>
        </DialogHeader>

        {/* デバイス情報表示 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {userDevice.device.category.name}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-4">
              <DeviceImage
                src={userDevice.device.amazonImageUrl}
                alt={userDevice.device.name}
                width={80}
                height={80}
                className="w-20 h-20 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-base leading-tight">
                  {userDevice.device.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ASIN: {userDevice.device.asin}
                </p>
                {userDevice.device.ogDescription && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {userDevice.device.ogDescription}
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
                      このデバイスを他のユーザーに公開しますか？
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
              登録日: {new Date(userDevice.createdAt).toLocaleDateString('ja-JP', {
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