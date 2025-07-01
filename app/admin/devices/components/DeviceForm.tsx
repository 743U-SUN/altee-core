'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceImage } from '@/components/devices/device-image'
import {
  extractAsinFromUrl,
  fetchOgData,
  getDeviceCategories,
  createDevice,
  checkAsinExists,
  type CreateDeviceData
} from '@/app/actions/device-actions'
import type { DeviceCategoryWithAttributes, AmazonOgData } from '@/types/device'
import type { CategoryAttribute } from '@prisma/client'

const deviceSchema = z.object({
  amazonUrl: z.string().min(1, 'Amazon URLを入力してください'),
  name: z.string().min(1, 'デバイス名を入力してください'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
})

type DeviceFormData = z.infer<typeof deviceSchema>

interface DeviceFormProps {
  initialData?: Partial<CreateDeviceData>
  deviceId?: string
}

export function DeviceForm({ initialData, deviceId }: DeviceFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<DeviceCategoryWithAttributes[]>([])
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategoryWithAttributes | null>(null)
  const [ogData, setOgData] = useState<AmazonOgData | null>(null)
  const [asin, setAsin] = useState<string>('')
  const [isLoadingOg, setIsLoadingOg] = useState(false)
  const [attributes, setAttributes] = useState<{ [key: string]: string }>({})

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: initialData ? {
      amazonUrl: initialData.amazonUrl || '',
      name: initialData.name || '',
      description: initialData.description || '',
      categoryId: initialData.categoryId || '',
    } : undefined
  })

  const watchedCategoryId = watch('categoryId')
  const watchedAmazonUrl = watch('amazonUrl')

  // カテゴリデータ取得
  useEffect(() => {
    const loadCategories = async () => {
      const categoryData = await getDeviceCategories()
      setCategories(categoryData)
    }
    loadCategories()
  }, [])

  // 選択されたカテゴリの属性を設定
  useEffect(() => {
    if (watchedCategoryId) {
      const category = categories.find(cat => cat.id === watchedCategoryId)
      setSelectedCategory(category || null)
      // 属性値をリセット
      if (category && !initialData) {
        setAttributes({})
      }
    }
  }, [watchedCategoryId, categories, initialData])

  // Amazon URL解析とOG情報取得
  const handleUrlAnalysis = async () => {
    const url = watchedAmazonUrl?.trim()
    if (!url) return

    setIsLoadingOg(true)

    try {
      // ASIN抽出
      const asinResult = await extractAsinFromUrl(url)
      if (!asinResult.success) {
        toast.error(asinResult.error || 'URL解析に失敗しました')
        setIsLoadingOg(false)
        return
      }

      setAsin(asinResult.asin!)

      // ASIN重複チェック
      if (!deviceId) { // 新規作成時のみチェック
        const exists = await checkAsinExists(asinResult.asin!)
        if (exists) {
          toast.error('このASINのデバイスは既に登録されています')
          setIsLoadingOg(false)
          return
        }
      }

      // OG情報取得
      const ogResult = await fetchOgData(url)
      if (ogResult.success && ogResult.data) {
        setOgData(ogResult.data)
        // フォームに自動入力
        if (ogResult.data.title && !watch('name')) {
          setValue('name', ogResult.data.title)
        }
        if (ogResult.data.description && !watch('description')) {
          setValue('description', ogResult.data.description)
        }
        toast.success('商品情報を取得しました')
      } else {
        toast.error(ogResult.error || 'OG情報の取得に失敗しました')
      }
    } catch {
      toast.error('URL解析中にエラーが発生しました')
    } finally {
      setIsLoadingOg(false)
    }
  }

  // 属性値の更新
  const handleAttributeChange = (attributeId: string, value: string) => {
    setAttributes(prev => ({
      ...prev,
      [attributeId]: value
    }))
  }

  // フォーム送信
  const onSubmit = async (data: DeviceFormData) => {
    if (!asin) {
      toast.error('Amazon URLを解析してASINを取得してください')
      return
    }

    const deviceData: CreateDeviceData = {
      asin,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      amazonUrl: data.amazonUrl,
      amazonImageUrl: ogData?.image,
      ogTitle: ogData?.title,
      ogDescription: ogData?.description,
      attributes
    }

    const result = await createDevice(deviceData)
    
    if (result.success) {
      toast.success('デバイスを登録しました')
      router.push('/admin/devices')
    } else {
      toast.error(result.error || 'デバイスの登録に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Amazon URL入力 */}
      <div className="space-y-2">
        <Label htmlFor="amazonUrl">Amazon URL</Label>
        <div className="flex space-x-2">
          <Input
            {...register('amazonUrl')}
            placeholder="https://amazon.co.jp/dp/..."
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlAnalysis}
            disabled={isLoadingOg || !watchedAmazonUrl}
            variant="outline"
          >
            {isLoadingOg ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              '解析'
            )}
          </Button>
        </div>
        {errors.amazonUrl && (
          <p className="text-sm text-destructive">{errors.amazonUrl.message}</p>
        )}
      </div>

      {/* OG情報プレビュー */}
      {ogData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">取得した商品情報</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-4">
            {ogData.image && (
              <DeviceImage
                src={ogData.image}
                alt={ogData.title || 'デバイス画像'}
                width={100}
                height={100}
                className="flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium">{ogData.title}</h4>
              {ogData.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                  {ogData.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                ASIN: {asin}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 基本情報 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">デバイス名</Label>
          <Input {...register('name')} placeholder="マウス名など" />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">カテゴリ</Label>
          <Select onValueChange={(value) => setValue('categoryId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">説明（任意）</Label>
        <Textarea {...register('description')} placeholder="デバイスの詳細説明" />
      </div>

      {/* 属性入力 */}
      {selectedCategory?.attributes && selectedCategory.attributes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{selectedCategory.name}の詳細属性</CardTitle>
            <CardDescription>任意項目です。分かる範囲で入力してください。</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCategory.attributes.map((attr: CategoryAttribute) => (
                <div key={attr.id} className="space-y-2">
                  <Label>
                    {attr.name}
                    {attr.unit && <span className="text-muted-foreground"> ({attr.unit})</span>}
                  </Label>
                  
                  {attr.type === 'SELECT' ? (
                    <Select
                      onValueChange={(value) => handleAttributeChange(attr.id, value)}
                      value={attributes[attr.id] || ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        {attr.options && Array.isArray(attr.options) 
                          ? (attr.options as string[])
                              .filter((option: unknown): option is string => typeof option === 'string')
                              .map((option: string) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))
                          : null
                        }
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={attr.type === 'NUMBER' ? 'number' : 'text'}
                      placeholder={`${attr.name}を入力`}
                      value={attributes[attr.id] || ''}
                      onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 送信ボタン */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              登録中...
            </>
          ) : (
            '登録'
          )}
        </Button>
      </div>
    </form>
  )
}