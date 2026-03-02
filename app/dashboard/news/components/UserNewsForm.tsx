'use client'

import { Suspense, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { MarkdownToolbar } from '@/components/editor/markdown-toolbar'
import { UserNewsMarkdownPreview } from '@/components/editor/user-news-markdown-preview'
import { Edit, Eye, ImageIcon, Save, ArrowLeft } from 'lucide-react'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import {
  createUserNews,
  updateUserNews,
} from '@/app/actions/content/user-news-actions'
import { userNewsFormSchema, type UserNewsFormValues } from './types'
import type { UploadedFile } from '@/types/image-upload'
import type { UserNewsWithImages } from '@/types/user-news'

interface UserNewsFormProps {
  editData?: UserNewsWithImages
}

export function UserNewsForm({ editData }: UserNewsFormProps) {
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 画像はフォームの外で独立管理
  const [thumbnail, setThumbnail] = useState<UploadedFile[]>(() => {
    if (editData?.thumbnail?.storageKey) {
      return [
        {
          id: editData.thumbnailId!,
          name: '',
          originalName: '',
          url: getPublicUrl(editData.thumbnail.storageKey),
          key: editData.thumbnail.storageKey,
          size: 0,
          type: 'image/webp',
          uploadedAt: '',
        },
      ]
    }
    return []
  })

  const [bodyImage, setBodyImage] = useState<UploadedFile[]>(() => {
    if (editData?.bodyImage?.storageKey) {
      return [
        {
          id: editData.bodyImageId!,
          name: '',
          originalName: '',
          url: getPublicUrl(editData.bodyImage.storageKey),
          key: editData.bodyImage.storageKey,
          size: 0,
          type: 'image/webp',
          uploadedAt: '',
        },
      ]
    }
    return []
  })

  const form = useForm<UserNewsFormValues>({
    resolver: zodResolver(userNewsFormSchema),
    defaultValues: {
      title: editData?.title ?? '',
      slug: editData?.slug ?? '',
      excerpt: editData?.excerpt ?? '',
      content: editData?.content ?? '',
      published: editData?.published ?? false,
    },
  })

  // プレビュー用: bodyImageのURL
  const bodyImageUrl = bodyImage.length > 0 ? bodyImage[0].url : null

  const handleMarkdownInsert = (
    text: string,
    type: 'wrap' | 'insert' = 'insert'
  ) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = form.getValues('content')
    const selectedText = currentValue.slice(start, end)

    let newText = ''
    let newCursorPosition = start

    if (type === 'wrap' && selectedText) {
      newText = text + selectedText + text
      newCursorPosition =
        start + text.length + selectedText.length + text.length
    } else if (type === 'wrap') {
      newText = text + text
      newCursorPosition = start + text.length
    } else {
      newText = text
      newCursorPosition = start + text.length
    }

    const newValue =
      currentValue.slice(0, start) + newText + currentValue.slice(end)

    form.setValue('content', newValue, { shouldValidate: true })

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
    }, 0)
  }

  const onSubmit = async (values: UserNewsFormValues) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('slug', values.slug)
      formData.append('excerpt', values.excerpt)
      formData.append('content', values.content)
      formData.append('published', String(values.published))
      if (thumbnail.length > 0) formData.append('thumbnailId', thumbnail[0].id)
      if (bodyImage.length > 0) formData.append('bodyImageId', bodyImage[0].id)

      if (editData) {
        await updateUserNews(editData.id, formData)
        toast.success('記事を更新しました')
      } else {
        await createUserNews(formData)
        toast.success('記事を作成しました')
      }

      router.push('/dashboard/news')
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : '操作に失敗しました'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push('/dashboard/news')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            戻る
          </Button>
        </div>

        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>タイトル</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ニュースのタイトルを入力"
                      maxLength={100}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>スラッグ</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="news-slug"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URLに使用されます。英数字とハイフンのみ使用可能です。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="excerpt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>要約</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="記事の要約を入力（一覧やOGPで表示されます）"
                      className="min-h-[80px] resize-none"
                      maxLength={200}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value.length} / 200文字
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 画像 */}
        <Card>
          <CardHeader>
            <CardTitle>画像</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-2">サムネイル画像</p>
              <ImageUploader
                mode="immediate"
                previewSize="large"
                maxFiles={1}
                folder="user-news-thumbnails"
                value={thumbnail}
                onUpload={setThumbnail}
                onDelete={() => setThumbnail([])}
                onError={(error) => toast.error(error)}
              />
            </div>

            <div>
              <p className="text-sm font-medium mb-2">
                本文内画像（[image] タグで表示）
              </p>
              <ImageUploader
                mode="immediate"
                previewSize="medium"
                maxFiles={1}
                folder="user-news-images"
                value={bodyImage}
                onUpload={setBodyImage}
                onDelete={() => setBodyImage([])}
                onError={(error) => toast.error(error)}
              />
            </div>
          </CardContent>
        </Card>

        {/* 本文エディタ */}
        <Card>
          <CardHeader>
            <CardTitle>本文</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <Tabs defaultValue="edit" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger
                        value="edit"
                        className="flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        編集
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        プレビュー
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="edit" className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MarkdownToolbar
                          onInsert={handleMarkdownInsert}
                          disabled={isSubmitting}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() =>
                            handleMarkdownInsert('[image]', 'insert')
                          }
                          disabled={isSubmitting}
                          title="本文内画像を挿入"
                        >
                          <ImageIcon className="h-4 w-4 mr-1" />
                          [image]
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Markdown形式でニュースの本文を記述してください。&#10;&#10;[youtube=VIDEO_ID] でYouTube動画を埋め込めます。&#10;[image] で本文内画像を表示できます。"
                          className="min-h-[300px] font-mono"
                          {...field}
                          ref={(e) => {
                            field.ref(e)
                            textareaRef.current = e
                          }}
                        />
                      </FormControl>
                    </TabsContent>

                    <TabsContent value="preview" className="mt-4">
                      <div className="min-h-[300px] border rounded-md p-4 bg-muted/30">
                        {field.value ? (
                          <Suspense
                            fallback={
                              <div className="text-muted-foreground text-center py-12">
                                プレビューを読み込み中...
                              </div>
                            }
                          >
                            <UserNewsMarkdownPreview
                              content={field.value}
                              bodyImageUrl={bodyImageUrl}
                            />
                          </Suspense>
                        ) : (
                          <div className="text-muted-foreground text-center py-12">
                            プレビューする内容がありません。
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* フッター: 公開トグル + 保存ボタン */}
        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="published"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormLabel className="text-sm">公開</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-1" />
            {isSubmitting ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
