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
import { Label } from '@/components/ui/label'
import {
  fetchOgData,
  updateDevice,
  type CreateDeviceData
} from '@/app/actions/device-actions'
import type { AmazonOgData } from '@/types/device'
import { useDeviceCategories } from './hooks/useDeviceCategories'
import { useCustomImageValidation } from './hooks/useCustomImageValidation'
import { useDeviceAttributes } from './hooks/useDeviceAttributes'
import { CustomImageSection } from './shared/CustomImageSection'
import { OgDataCard } from './shared/OgDataCard'
import { DeviceBasicFields } from './shared/DeviceBasicFields'
import { DeviceAttributeFields } from './shared/DeviceAttributeFields'

const deviceSchema = z.object({
  amazonUrl: z.string().min(1, 'Amazon URLを入力してください'),
  customImageUrl: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  name: z.string().min(1, 'デバイス名を入力してください'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'カテゴリを選択してください'),
})

type DeviceFormData = z.infer<typeof deviceSchema>

interface DeviceEditFormProps {
  initialData: CreateDeviceData & { attributes?: { [key: string]: string } }
  deviceId: string
  asin: string
}

export function DeviceEditForm({ initialData, deviceId, asin }: DeviceEditFormProps) {
  const router = useRouter()
  const [ogData, setOgData] = useState<AmazonOgData>({
    title: initialData.ogTitle || undefined,
    description: initialData.ogDescription || undefined,
    image: initialData.amazonImageUrl || undefined
  })
  const [isLoadingOg, setIsLoadingOg] = useState(false)

  const { categories, selectedCategory, updateSelectedCategory } = useDeviceCategories(initialData.categoryId)
  const { customImagePreview, isLoadingCustomImage, validateCustomImage, setCustomImagePreview } = useCustomImageValidation()
  const { attributes, handleAttributeChange } = useDeviceAttributes(initialData.attributes)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      amazonUrl: initialData.amazonUrl || '',
      customImageUrl: initialData.customImageUrl || '',
      name: initialData.name || '',
      description: initialData.description || '',
      categoryId: initialData.categoryId || '',
    }
  })

  const watchedCategoryId = watch('categoryId')
  const watchedAmazonUrl = watch('amazonUrl')
  const watchedCustomImageUrl = watch('customImageUrl')

  // カテゴリ変更時の処理
  useEffect(() => {
    if (watchedCategoryId) {
      updateSelectedCategory(watchedCategoryId)
    }
  }, [watchedCategoryId, updateSelectedCategory])

  // カスタム画像プレビューの初期化
  useEffect(() => {
    if (initialData.customImageUrl) {
      setCustomImagePreview(initialData.customImageUrl)
    }
  }, [initialData.customImageUrl, setCustomImagePreview])

  // OG情報再取得
  const handleUpdateOgData = async () => {
    const url = watchedAmazonUrl?.trim()
    if (!url) return

    setIsLoadingOg(true)

    try {
      const ogResult = await fetchOgData(url)
      if (ogResult.success && ogResult.data) {
        setOgData(ogResult.data)
        toast.success('商品情報を更新しました')
      } else {
        toast.error(ogResult.error || 'OG情報の取得に失敗しました')
      }
    } catch {
      toast.error('OG情報取得中にエラーが発生しました')
    } finally {
      setIsLoadingOg(false)
    }
  }

  // フォーム送信
  const onSubmit = async (data: DeviceFormData) => {
    const deviceData: Partial<CreateDeviceData> = {
      name: data.name,
      description: data.description,
      categoryId: data.categoryId,
      amazonUrl: data.amazonUrl,
      amazonImageUrl: ogData?.image,
      customImageUrl: data.customImageUrl || undefined,
      ogTitle: ogData?.title,
      ogDescription: ogData?.description,
      attributes
    }

    const result = await updateDevice(deviceId, deviceData)

    if (result.success) {
      toast.success('デバイス情報を更新しました')
      router.push('/admin/devices')
    } else {
      toast.error(result.error || 'デバイスの更新に失敗しました')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ASIN表示 */}
      <div className="bg-muted p-4 rounded-md">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">ASIN</h3>
            <p className="text-sm text-muted-foreground">{asin}</p>
          </div>
          <div className="text-xs text-muted-foreground">
            ※ASINは変更できません
          </div>
        </div>
      </div>

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
            onClick={handleUpdateOgData}
            disabled={isLoadingOg || !watchedAmazonUrl}
            variant="outline"
          >
            {isLoadingOg ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'OG情報更新'
            )}
          </Button>
        </div>
        {errors.amazonUrl && (
          <p className="text-sm text-destructive">{errors.amazonUrl.message}</p>
        )}
      </div>

      {/* カスタム画像セクション */}
      <CustomImageSection
        register={register}
        errors={errors}
        customImageUrl={watchedCustomImageUrl}
        customImagePreview={customImagePreview}
        isLoadingCustomImage={isLoadingCustomImage}
        onValidate={() => validateCustomImage(watchedCustomImageUrl)}
      />

      {/* OG情報プレビュー */}
      <OgDataCard ogData={ogData} showAsin={false} />

      {/* 基本情報 */}
      <DeviceBasicFields
        register={register}
        errors={errors}
        setValue={setValue}
        categories={categories}
        watchedCategoryId={watchedCategoryId}
      />

      {/* 属性入力 */}
      <DeviceAttributeFields
        selectedCategory={selectedCategory}
        attributes={attributes}
        onAttributeChange={handleAttributeChange}
      />

      {/* 送信ボタン */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              更新中...
            </>
          ) : (
            '更新'
          )}
        </Button>
      </div>
    </form>
  )
}
