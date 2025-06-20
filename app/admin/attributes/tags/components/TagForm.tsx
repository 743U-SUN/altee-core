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
import { createTag, updateTag } from '@/app/actions/tag-actions'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import type { TagWithArticles } from './types'

const formSchema = z.object({
  name: z.string().min(1, 'タグ名は必須です').max(50, 'タグ名は50文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(100, 'スラッグは100文字以内で入力してください'),
  description: z.string().max(200, '説明は200文字以内で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, '正しいカラーコードを入力してください').optional(),
})

type FormValues = z.infer<typeof formSchema>

interface TagFormProps {
  tag?: TagWithArticles
  mode: 'create' | 'edit'
}

// スラッグ生成用ヘルパー
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100)
}

export function TagForm({ tag, mode }: TagFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoSlug, setAutoSlug] = useState(mode === 'create') // 新規作成時のみ自動生成
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tag?.name || '',
      slug: tag?.slug || '',
      description: tag?.description || '',
      color: tag?.color || '',
    },
  })

  const handleNameChange = (name: string) => {
    if (autoSlug) {
      form.setValue('slug', generateSlug(name))
    }
  }

  const handleSlugChange = () => {
    setAutoSlug(false) // 手動でスラッグを変更した場合、自動生成を停止
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('slug', values.slug)
      if (values.description) formData.append('description', values.description)
      if (values.color) formData.append('color', values.color)

      if (mode === 'create') {
        await createTag(formData)
        toast.success('タグが作成されました')
      } else if (tag) {
        await updateTag(tag.id, formData)
        toast.success('タグが更新されました')
      }
      
      router.push('/admin/attributes/tags')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = mode === 'edit'
  const title = isEditing ? 'タグ編集' : '新規タグ作成'
  const submitText = isEditing ? '更新' : '作成'

  return (
    <div className="space-y-6">
      {/* ナビゲーション */}
      <div className="flex items-center gap-4">
        <Link href="/admin/attributes/tags">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            タグ一覧に戻る
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* タグ名 */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>タグ名 *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleNameChange(e.target.value)
                          }}
                          placeholder="タグ名を入力"
                        />
                      </FormControl>
                      <FormDescription>
                        記事で表示されるタグ名です。
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
                        <Input
                          {...field}
                          onChange={(e) => {
                            field.onChange(e)
                            handleSlugChange()
                          }}
                          placeholder="tag-slug"
                        />
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
                    <FormItem className="md:col-span-2">
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
                            className="flex-1 max-w-32"
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
                        placeholder="タグの説明を入力（任意）"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      このタグについての説明（最大200文字）
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 使用状況表示（編集時のみ） */}
              {isEditing && tag && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">使用状況</h4>
                  <p className="text-sm text-muted-foreground">
                    このタグは現在 <strong>{tag._count.articles}件の記事</strong> で使用されています。
                    {tag._count.articles > 0 && (
                      <span className="block mt-1">
                        記事で使用中のタグは削除できません。
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
                <Link href="/admin/attributes/tags">
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