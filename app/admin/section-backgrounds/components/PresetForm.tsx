'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createPresetAction,
  updatePresetAction,
} from '@/app/actions/admin/section-background-actions'
import type { PresetInput } from '@/lib/validations/section-settings'
import { PresetPreview } from './PresetPreview'
import type { SectionBackgroundPreset } from '@prisma/client'

// ===== フォームスキーマ =====

const gradientStopSchema = z.object({
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '有効なHEXカラーを入力してください'),
  position: z.coerce.number().min(0).max(100),
})

const formSchema = z.discriminatedUnion('category', [
  z.object({
    name: z.string().min(1, '名前は必須です').max(100),
    category: z.literal('solid'),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, '有効なHEXカラーを入力してください'),
    isActive: z.boolean(),
    sortOrder: z.coerce.number().int().min(0),
  }),
  z.object({
    name: z.string().min(1, '名前は必須です').max(100),
    category: z.literal('gradient'),
    gradientType: z.enum(['linear', 'radial', 'conic']),
    angle: z.coerce.number().min(0).max(360),
    stops: z.array(gradientStopSchema).min(2, '2色以上必要です').max(10),
    isActive: z.boolean(),
    sortOrder: z.coerce.number().int().min(0),
  }),
])

type FormValues = z.infer<typeof formSchema>

interface PresetFormProps {
  preset?: SectionBackgroundPreset
}

/**
 * プリセット作成/編集フォーム
 */
export function PresetForm({ preset }: PresetFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const isEditing = !!preset

  // 既存データからデフォルト値を構築
  const defaultValues = buildDefaultValues(preset)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  const category = form.watch('category')

  // gradient の stops 管理
  const stopsFieldArray = useFieldArray({
    control: form.control,
    name: 'stops',
  })

  // ライブプレビュー用データ構築（必要フィールドのみ watch）
  const [watchedColor, watchedGradientType, watchedAngle, watchedStops] = form.watch([
    'color' as never,
    'gradientType' as never,
    'angle' as never,
    'stops' as never,
  ] as const) as [string | undefined, string | undefined, number | undefined, { color: string; position: number }[] | undefined]
  const previewConfig = category === 'solid'
    ? { color: watchedColor }
    : { type: watchedGradientType, angle: watchedAngle, stops: watchedStops }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const input = buildPresetInput(data)

      const result = isEditing
        ? await updatePresetAction(preset.id, input)
        : await createPresetAction(input)

      if (result.success) {
        toast.success(isEditing ? 'プリセットを更新しました' : 'プリセットを作成しました')
        router.push('/admin/section-backgrounds')
        router.refresh()
      } else {
        toast.error(result.error || '保存に失敗しました')
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム: フォーム */}
        <div className="lg:col-span-2 space-y-6">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">名前</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="例: Midnight Blue"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>カテゴリ</Label>
                  <Select
                    value={category}
                    onValueChange={(value: 'solid' | 'gradient') => {
                      form.setValue('category', value, { shouldValidate: true })
                      // カテゴリ変更時にフォームをリセット
                      if (value === 'solid') {
                        form.setValue('color' as never, '#374151' as never)
                      } else {
                        form.setValue('gradientType' as never, 'linear' as never)
                        form.setValue('angle' as never, 135 as never)
                        form.setValue('stops' as never, [
                          { color: '#667eea', position: 0 },
                          { color: '#764ba2', position: 100 },
                        ] as never)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">単色</SelectItem>
                      <SelectItem value="gradient">グラデーション</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">表示順</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    {...form.register('sortOrder')}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked)}
                />
                <Label>公開</Label>
              </div>
            </CardContent>
          </Card>

          {/* カテゴリ別設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {category === 'solid' ? '色設定' : 'グラデーション設定'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {category === 'solid' ? (
                <SolidConfig form={form} />
              ) : (
                <GradientConfig
                  form={form}
                  stopsFieldArray={stopsFieldArray}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右カラム: プレビュー */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">プレビュー</CardTitle>
            </CardHeader>
            <CardContent>
              <PresetPreview
                category={category}
                config={previewConfig}
                size="lg"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* アクションボタン */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/section-backgrounds')}
        >
          キャンセル
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? '保存中...'
            : isEditing
              ? 'プリセットを更新'
              : 'プリセットを作成'}
        </Button>
      </div>
    </form>
  )
}

// ===== 単色設定 =====

function SolidConfig({ form }: { form: ReturnType<typeof useForm<FormValues>> }) {
  return (
    <div className="space-y-3">
      <Label htmlFor="color">背景色</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          {...form.register('color' as never)}
          className="w-12 h-10 rounded border cursor-pointer"
        />
        <Input
          {...form.register('color' as never)}
          placeholder="#374151"
          className="max-w-[160px] font-mono"
        />
      </div>
    </div>
  )
}

// ===== グラデーション設定 =====

function GradientConfig({
  form,
  stopsFieldArray,
}: {
  form: ReturnType<typeof useForm<FormValues>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stopsFieldArray: ReturnType<typeof useFieldArray<any, any>>
}) {
  const gradientType = form.watch('gradientType' as never) as unknown as string

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>タイプ</Label>
          <Select
            value={gradientType || 'linear'}
            onValueChange={(v) => form.setValue('gradientType' as never, v as never)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear</SelectItem>
              <SelectItem value="radial">Radial</SelectItem>
              <SelectItem value="conic">Conic</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {gradientType === 'linear' && (
          <div className="space-y-2">
            <Label htmlFor="angle">角度 (deg)</Label>
            <Input
              id="angle"
              type="number"
              {...form.register('angle' as never)}
              min={0}
              max={360}
            />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>カラーストップ</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              stopsFieldArray.append({ color: '#000000', position: 50 })
            }
            disabled={stopsFieldArray.fields.length >= 10}
          >
            <Plus className="w-3 h-3 mr-1" />
            追加
          </Button>
        </div>

        {stopsFieldArray.fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              type="color"
              {...form.register(`stops.${index}.color` as never)}
              className="w-10 h-8 rounded border cursor-pointer flex-shrink-0"
            />
            <Input
              {...form.register(`stops.${index}.color` as never)}
              className="max-w-[120px] font-mono text-sm"
              placeholder="#000000"
            />
            <Input
              type="number"
              {...form.register(`stops.${index}.position` as never)}
              className="max-w-[80px] text-sm"
              min={0}
              max={100}
              placeholder="%"
            />
            <span className="text-xs text-muted-foreground">%</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => stopsFieldArray.remove(index)}
              disabled={stopsFieldArray.fields.length <= 2}
              className="flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===== ヘルパー関数 =====

function buildDefaultValues(preset?: SectionBackgroundPreset): FormValues {
  if (!preset) {
    return {
      name: '',
      category: 'solid',
      color: '#374151',
      isActive: true,
      sortOrder: 0,
    }
  }

  const config = preset.config as Record<string, unknown>

  if (preset.category === 'gradient') {
    return {
      name: preset.name,
      category: 'gradient',
      gradientType: (config.type as 'linear' | 'radial' | 'conic') || 'linear',
      angle: (config.angle as number) ?? 135,
      stops: (config.stops as { color: string; position: number }[]) || [
        { color: '#667eea', position: 0 },
        { color: '#764ba2', position: 100 },
      ],
      isActive: preset.isActive,
      sortOrder: preset.sortOrder,
    }
  }

  return {
    name: preset.name,
    category: 'solid',
    color: (config.color as string) || '#374151',
    isActive: preset.isActive,
    sortOrder: preset.sortOrder,
  }
}

function buildPresetInput(data: FormValues): PresetInput {
  if (data.category === 'solid') {
    return {
      name: data.name,
      category: 'solid',
      config: { color: data.color },
      isActive: data.isActive,
      sortOrder: data.sortOrder,
    }
  }
  return {
    name: data.name,
    category: 'gradient',
    config: {
      type: data.gradientType,
      angle: data.angle,
      stops: data.stops,
    },
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  }
}
