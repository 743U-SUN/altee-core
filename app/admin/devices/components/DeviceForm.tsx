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
  extractAsinFromUrl,
  fetchOgData,
  createDevice,
  checkAsinExists,
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

interface DeviceFormProps {
  initialData?: Partial<CreateDeviceData>
  deviceId?: string
}

export function DeviceForm({ initialData, deviceId }: DeviceFormProps) {
  const router = useRouter()
  const [ogData, setOgData] = useState<AmazonOgData | null>(null)
  const [asin, setAsin] = useState<string>('')
  const [isLoadingOg, setIsLoadingOg] = useState(false)

  const { categories, selectedCategory, updateSelectedCategory } = useDeviceCategories(initialData?.categoryId)
  const { customImagePreview, isLoadingCustomImage, validateCustomImage, setCustomImagePreview } = useCustomImageValidation()
  const { attributes, handleAttributeChange, resetAttributes } = useDeviceAttributes()

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
      customImageUrl: initialData.customImageUrl || '',
      name: initialData.name || '',
      description: initialData.description || '',
      categoryId: initialData.categoryId || '',
    } : undefined
  })

  const watchedCategoryId = watch('categoryId')
  const watchedAmazonUrl = watch('amazonUrl')
  const watchedCustomImageUrl = watch('customImageUrl')

  // カテゴリ変更時の処理
  useEffect(() => {
    if (watchedCategoryId) {
      updateSelectedCategory(watchedCategoryId)
      // 属性値をリセット（初期データがない場合のみ）
      if (!initialData) {
        resetAttributes()
      }
    }
  }, [watchedCategoryId, initialData, updateSelectedCategory, resetAttributes])

  // カスタム画像プレビューの初期化
  useEffect(() => {
    if (initialData?.customImageUrl) {
      setCustomImagePreview(initialData.customImageUrl)
    }
  }, [initialData?.customImageUrl, setCustomImagePreview])

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
        const existsResult = await checkAsinExists(asinResult.asin!)
        if (existsResult.exists) {
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
      customImageUrl: data.customImageUrl || undefined,
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
      <OgDataCard ogData={ogData} asin={asin} showAsin={true} />

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
