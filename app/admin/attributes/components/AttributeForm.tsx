'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

// ===== スキーマ =====

const baseSchema = {
  name: z.string().min(1, '名前は必須です').max(50, '名前は50文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(100, 'スラッグは100文字以内で入力してください'),
  description: z.string().max(200, '説明は200文字以内で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '正しいカラーコードを入力してください').optional(),
}

const formSchemaWithOrder = z.object({
  ...baseSchema,
  order: z.number().int().min(0, '表示順序は0以上で入力してください').optional(),
})

const formSchemaWithoutOrder = z.object(baseSchema)

// ===== 型 =====

type FormValuesWithOrder = z.infer<typeof formSchemaWithOrder>
type FormValuesWithoutOrder = z.infer<typeof formSchemaWithoutOrder>

interface AttributeItem {
  id: string
  name: string
  slug: string
  description?: string | null
  color?: string | null
  order?: number
  _count: { articles: number }
}

interface AttributeFormProps<T extends AttributeItem> {
  item?: T
  mode: 'create' | 'edit'
  /** カテゴリ名（例: "カテゴリ", "タグ"） */
  entityLabel: string
  /** 一覧ページへのパス */
  listPath: string
  /** 表示順フィールドを持つか */
  hasOrder?: boolean
  onSubmit: (
    values: { name: string; slug: string; description?: string; color?: string; order?: number },
    id?: string
  ) => Promise<void>
}

/**
 * カテゴリ・タグ共通フォームコンポーネント
 */
export function AttributeForm<T extends AttributeItem>({
  item,
  mode,
  entityLabel,
  listPath,
  hasOrder = false,
  onSubmit,
}: AttributeFormProps<T>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const schema = hasOrder ? formSchemaWithOrder : formSchemaWithoutOrder
  type FormValues = typeof hasOrder extends true ? FormValuesWithOrder : FormValuesWithoutOrder

  const form = useForm<FormValuesWithOrder>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name || '',
      slug: item?.slug || '',
      description: item?.description || '',
      color: item?.color || '',
      ...(hasOrder && { order: item?.order ?? 0 }),
    },
  })

  const handleSubmit = async (values: FormValuesWithOrder) => {
    setIsSubmitting(true)
    try {
      await onSubmit(values, item?.id)
      router.push(listPath)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = mode === 'edit'
  const title = isEditing ? `${entityLabel}編集` : `新規${entityLabel}作成`
  const submitText = isEditing ? '更新' : '作成'

  return (
    <div className="space-y-6">
      {/* ナビゲーション */}
      <div className="flex items-center gap-4">
        <Link href={listPath}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {entityLabel}一覧に戻る
          </Button>
        </Link>
      </div>

      {/* フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* 名前 */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{entityLabel}名 *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={`${entityLabel}名を入力`} />
                      </FormControl>
                      <FormDescription>
                        記事で表示される{entityLabel}名です。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* スラッグ */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>スラッグ *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={`${entityLabel.toLowerCase()}-slug`} />
                      </FormControl>
                      <FormDescription>
                        URLで使用される識別子です。英数字とハイフンのみ使用可能。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* カラーコード */}
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem className={!hasOrder ? 'md:col-span-2' : undefined}>
                      <FormLabel>カラーコード</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            {...field}
                            type="color"
                            className="w-16 h-10 p-1 border rounded"
                          />
                          <Input
                            value={field.value || ''}
                            onChange={field.onChange}
                            placeholder="#FF5733"
                            className={hasOrder ? 'flex-1' : 'flex-1 max-w-32'}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        UI表示用の色を設定します。HEX形式（#RRGGBB）で入力。
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 表示順序（カテゴリのみ） */}
                {hasOrder && (
                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>表示順序</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormDescription>
                          {entityLabel}の表示順序です。小さい数字ほど上に表示されます。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* 説明 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>説明</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={`${entityLabel}の説明を入力（任意）`}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      この{entityLabel}についての説明（最大200文字）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 使用状況表示（編集時のみ） */}
              {isEditing && item && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">使用状況</h4>
                  <p className="text-sm text-muted-foreground">
                    この{entityLabel}は現在 <strong>{item._count.articles}件の記事</strong> で使用されています。
                    {item._count.articles > 0 && (
                      <span className="block mt-1">
                        記事で使用中の{entityLabel}は削除できません。
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* 送信ボタン */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? `${submitText}中...` : submitText}
                </Button>
                <Link href={listPath}>
                  <Button variant="outline" type="button">
                    キャンセル
                  </Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
