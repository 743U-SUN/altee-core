'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createArticle, updateArticle } from '@/app/actions/article-actions'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { toast } from 'sonner'
import { Save, ArrowLeft, Edit, Eye, Download } from 'lucide-react'
import Link from 'next/link'
import type { UploadedFile } from '@/types/image-upload'
import { MarkdownPreview } from '@/components/ui/markdown-preview'
import { downloadMarkdownFile, createExportDataFromForm, createExportDataFromArticle } from '@/lib/markdown-export'

const formSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(255, 'スラッグは255文字以内で入力してください'),
  content: z.string().min(1, 'コンテンツは必須です'),
  excerpt: z.string().max(500, '要約は500文字以内で入力してください').optional(),
  published: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>
// Note: サムネイル画像は独立管理（thumbnailステート）

interface Article {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  published: boolean
  createdAt: Date | string
  updatedAt: Date | string
  author?: {
    id: string
    name: string | null
    email: string
  }
  thumbnail: {
    id: string
    storageKey: string
    originalName: string
  } | null
}

interface ArticleFormProps {
  article?: Article
}

// スラッグ生成用ヘルパー
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 255)
}

export function ArticleForm({ article }: ArticleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [thumbnail, setThumbnail] = useState<UploadedFile[]>(
    article?.thumbnail ? [{
      id: article.thumbnail.id,
      name: article.thumbnail.originalName,
      originalName: article.thumbnail.originalName,
      url: `${process.env.NEXT_PUBLIC_STORAGE_URL}/${article.thumbnail.storageKey}`,
      key: article.thumbnail.storageKey,
      size: 0,
      type: 'image/*',
      uploadedAt: new Date().toISOString()
    }] : []
  )
  const [autoSlug, setAutoSlug] = useState(!article) // 新規作成時のみ自動生成
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: article?.title || '',
      slug: article?.slug || '',
      content: article?.content || '',
      excerpt: article?.excerpt || '',
      published: article?.published || false,
    },
  })

  const handleTitleChange = (title: string) => {
    if (autoSlug) {
      form.setValue('slug', generateSlug(title))
    }
  }

  const handleSlugChange = () => {
    setAutoSlug(false) // 手動でスラッグを変更した場合、自動生成を停止
  }

  const handleExport = () => {
    try {
      const formValues = form.getValues()
      
      if (article) {
        // 既存記事の場合
        const exportData = createExportDataFromArticle({
          ...article,
          ...formValues // フォームの最新値で上書き
        })
        downloadMarkdownFile(exportData)
      } else {
        // 新規記事の場合
        if (!formValues.title || !formValues.slug || !formValues.content) {
          toast.error('タイトル、スラッグ、本文を入力してからエクスポートしてください')
          return
        }
        const exportData = createExportDataFromForm(formValues)
        downloadMarkdownFile(exportData)
      }
      
      toast.success('Markdownファイルをエクスポートしました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エクスポートに失敗しました')
    }
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      formData.append('title', values.title)
      formData.append('slug', values.slug)
      formData.append('content', values.content)
      formData.append('excerpt', values.excerpt || '')
      formData.append('published', values.published.toString())
      
      if (thumbnail.length > 0) {
        formData.append('thumbnailId', thumbnail[0].id)
      }

      if (article) {
        await updateArticle(article.id, formData)
        toast.success('記事が更新されました')
      } else {
        await createArticle(formData)
        toast.success('記事が作成されました')
      }
      
      router.push('/admin/articles')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ナビゲーション */}
      <div className="flex items-center gap-4">
        <Link href="/admin/articles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>基本情報</CardTitle>
                  <CardDescription>記事の基本的な情報を入力してください。</CardDescription>
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
                            placeholder="記事のタイトルを入力"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleTitleChange(e.target.value)
                            }}
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
                            placeholder="article-slug"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              handleSlugChange()
                            }}
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
                        <FormLabel>要約（任意）</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="記事の簡単な要約を入力"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          記事一覧やSEOで使用されます。500文字以内で入力してください。
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>本文</CardTitle>
                  <CardDescription>Markdown形式で記事の内容を記述してください。</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <Tabs defaultValue="edit" className="w-full">
                          <div className="sticky top-[69px] z-5 bg-card border-b border-border pt-2 pb-2 mb-4">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="edit" className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                編集
                              </TabsTrigger>
                              <TabsTrigger value="preview" className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                プレビュー
                              </TabsTrigger>
                            </TabsList>
                          </div>
                          
                          <TabsContent value="edit" className="mt-0">
                            <FormControl>
                              <Textarea 
                                placeholder="# 記事タイトル

記事の内容をMarkdown形式で記述してください。

## 見出し2

段落テキスト。**太字**や*斜体*、[リンク](https://example.com)なども使用できます。

- リスト項目1
- リスト項目2
- [x] チェックボックス
- [ ] 未完了タスク

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| データ1 | データ2 | データ3 |

:smile: 絵文字も使用できます :thumbsup:

```javascript
// コードブロック
console.log('Hello, World!');
```"
                                className="min-h-[400px] font-mono"
                                {...field}
                              />
                            </FormControl>
                          </TabsContent>
                          
                          <TabsContent value="preview" className="mt-0">
                            <div className="min-h-[400px] border rounded-md p-4 bg-muted/30">
                              {field.value ? (
                                <MarkdownPreview content={field.value} />
                              ) : (
                                <div className="text-muted-foreground text-center py-12">
                                  プレビューする内容がありません。<br />
                                  編集タブで記事の内容を入力してください。
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
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>公開設定</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">公開状態</FormLabel>
                          <FormDescription>
                            公開すると一般ユーザーが閲覧できるようになります。
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>サムネイル画像</CardTitle>
                  <CardDescription>記事のサムネイル画像を設定してください。</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    mode="immediate"
                    previewSize="medium"
                    maxFiles={1}
                    folder="article-thumbnails"
                    value={thumbnail}
                    onUpload={setThumbnail}
                    onError={(error) => toast.error(error)}
                  />
                </CardContent>
              </Card>

              <Separator />

              <div className="space-y-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? '保存中...' : article ? '更新' : '作成'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleExport}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  .mdでエクスポート
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}