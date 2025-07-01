'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { extractAsinFromUrl, fetchOgData, createDevice, createUserDevice } from "@/app/actions/device-actions"
import { UserDeviceWithDetails } from "@/types/device"
import { DeviceImage } from "@/components/devices/device-image"

const newDeviceSchema = z.object({
  amazonUrl: z.string().min(1, 'Amazon URLを入力してください'),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
  brandId: z.string().optional(),
  isPublic: z.boolean().default(true),
  review: z.string().optional(),
})

interface NewDeviceCreatorProps {
  userId: string
  categories: { id: string, name: string }[]
  brands: { id: string, name: string }[]
  onDeviceAdded: (userDevice: UserDeviceWithDetails) => void
}

export function NewDeviceCreator({ 
  userId, 
  categories, 
  brands, 
  onDeviceAdded 
}: NewDeviceCreatorProps) {
  const [ogData, setOgData] = useState<{ title?: string, description?: string, image?: string } | null>(null)
  const [isLoadingOg, setIsLoadingOg] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm({
    resolver: zodResolver(newDeviceSchema),
    defaultValues: {
      amazonUrl: '',
      categoryId: '',
      brandId: 'none',
      isPublic: true,
    }
  })

  // Amazon URL から OG データ取得
  const handleFetchOgData = async (url: string) => {
    if (!url.trim()) {
      toast.error('Amazon URLを入力してください')
      return
    }

    setIsLoadingOg(true)
    try {
      // ASIN抽出
      const asinResult = await extractAsinFromUrl(url)
      if (!asinResult.success) {
        toast.error(asinResult.error || 'URLの解析に失敗しました')
        return
      }

      // OG情報取得
      const ogResult = await fetchOgData(url)
      if (!ogResult.success) {
        toast.error(ogResult.error || 'デバイス情報の取得に失敗しました')
        return
      }

      setOgData(ogResult.data || null)
      toast.success('デバイス情報を取得しました')
    } catch {
      toast.error('情報の取得に失敗しました')
    } finally {
      setIsLoadingOg(false)
    }
  }

  // 新規デバイス作成＆登録
  const handleSubmit = async (data: z.infer<typeof newDeviceSchema>) => {
    if (!ogData) {
      toast.error('まずデバイス情報を取得してください')
      return
    }

    setIsSubmitting(true)
    try {
      // ASINチェック
      const asinResult = await extractAsinFromUrl(data.amazonUrl)
      if (!asinResult.success) {
        toast.error('無効なAmazon URLです')
        return
      }

      // デバイス作成
      const deviceResult = await createDevice({
        asin: asinResult.asin!,
        name: ogData.title || 'デバイス名',
        description: ogData.description,
        categoryId: data.categoryId,
        brandId: data.brandId === 'none' ? undefined : data.brandId,
        amazonUrl: data.amazonUrl,
        amazonImageUrl: ogData.image,
        ogTitle: ogData.title,
        ogDescription: ogData.description,
      })

      if (!deviceResult.success || !deviceResult.device) {
        toast.error(deviceResult.error || 'デバイスの作成に失敗しました')
        return
      }

      // ユーザーデバイス登録
      const userDeviceResult = await createUserDevice(userId, {
        deviceId: deviceResult.device.id,
        isPublic: data.isPublic,
        review: data.review,
      })

      if (userDeviceResult.success && userDeviceResult.userDevice) {
        toast.success('デバイスを登録しました')
        onDeviceAdded(userDeviceResult.userDevice as UserDeviceWithDetails)
        // Reset form
        form.reset()
        setOgData(null)
      } else {
        toast.error(userDeviceResult.error || 'デバイスの登録に失敗しました')
      }
    } catch {
      toast.error('登録に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex space-x-2">
          <FormField
            control={form.control}
            name="amazonUrl"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Amazon URL</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://amazon.co.jp/dp/..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleFetchOgData(form.getValues('amazonUrl'))}
              disabled={isLoadingOg}
            >
              {isLoadingOg ? <Loader2 className="h-4 w-4 animate-spin" /> : '情報取得'}
            </Button>
          </div>
        </div>

        {ogData && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                {ogData.image && (
                  <DeviceImage
                    src={ogData.image}
                    alt={ogData.title || '商品画像'}
                    width={80}
                    height={80}
                    className="w-20 h-20"
                  />
                )}
                <div>
                  <h4 className="font-medium">{ogData.title}</h4>
                  {ogData.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {ogData.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリ</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリを選択..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brandId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ブランド（任意）</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="ブランドを選択..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">指定しない</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="review"
          render={({ field }) => (
            <FormItem>
              <FormLabel>レビュー</FormLabel>
              <FormControl>
                <Textarea placeholder="使用感や感想を入力..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting || !ogData} className="w-full">
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          作成＆登録
        </Button>
      </form>
    </Form>
  )
}