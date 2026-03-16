'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { createArticle, updateArticle } from '@/app/actions/content/article-actions'
import { toast } from 'sonner'
import { ArrowLeft, Save, Download } from 'lucide-react'
import Link from 'next/link'
import type { UploadedFile } from '@/types/image-upload'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { PRESET_THUMBNAIL, PRESET_ARTICLE } from '@/lib/image-uploader/image-processing-presets'
import { downloadMarkdownFile, createExportDataFromForm, createExportDataFromArticle } from '@/lib/markdown-export'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { BasicInfoSection } from './BasicInfoSection'
import { ContentEditor } from './ContentEditor'
import { CategoryTagSelector } from './CategoryTagSelector'
import type { FormValues, ArticleDetail, CategoryItem, TagItem } from './types'

function thumbnailToUploadedFile(thumbnail: { id: string; storageKey: string; originalName: string }): UploadedFile {
  return {
    id: thumbnail.id,
    name: thumbnail.originalName,
    originalName: thumbnail.originalName,
    url: getPublicUrl(thumbnail.storageKey),
    key: thumbnail.storageKey,
    size: 0,
    type: 'image/*',
    uploadedAt: new Date().toISOString(),
  }
}

const formSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(255, 'スラッグは255文字以内で入力してください'),
  content: z.string().min(1, 'コンテンツは必須です'),
  excerpt: z.string().max(500, '要約は500文字以内で入力してください'),
  published: z.boolean(),
})
// Note: サムネイル画像は独立管理（thumbnailステート）

interface ArticleFormProps {
  article?: ArticleDetail
  initialCategories: CategoryItem[]
  initialTags: TagItem[]
}

export function ArticleForm({ article, initialCategories, initialTags }: ArticleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [thumbnail, setThumbnail] = useState<UploadedFile[]>(
    article?.thumbnail ? [thumbnailToUploadedFile(article.thumbnail)] : []
  )

  // 記事内画像の状態管理
  const [contentImages, setContentImages] = useState<UploadedFile[]>([])

  // カテゴリ・タグ選択状態
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    article?.categories?.map(cat => cat.categoryId) || []
  )
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    article?.tags?.map(tag => tag.tagId) || []
  )

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

  const handleExport = () => {
    try {
      const formValues = form.getValues()

      if (article) {
        const exportData = createExportDataFromArticle({
          ...article,
          ...formValues
        })
        downloadMarkdownFile(exportData)
      } else {
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

      selectedCategoryIds.forEach(categoryId => {
        formData.append('categoryIds', categoryId)
      })
      selectedTagIds.forEach(tagId => {
        formData.append('tagIds', tagId)
      })

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6">
        {/* ナビゲーション */}
        <div className="flex items-center gap-4">
          <Link href="/admin/articles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              記事一覧に戻る
            </Button>
          </Link>
        </div>

        {/* 公開設定 */}
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

          {/* 基本情報 */}
          <BasicInfoSection />

          {/* サムネイル画像 */}
          <Card>
            <CardHeader>
              <CardTitle>サムネイル画像</CardTitle>
              <CardDescription>記事のサムネイル画像を設定してください。</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                mode="immediate"
                previewSize="large"
                maxFiles={1}
                folder="article-thumbnails"
                value={thumbnail}
                onUpload={setThumbnail}
                onError={(error) => toast.error(error)}
                imageProcessingOptions={PRESET_THUMBNAIL}
                sequentialProcessing
              />
            </CardContent>
          </Card>

          {/* 記事内画像 */}
          <Card>
            <CardHeader>
              <CardTitle>記事内画像</CardTitle>
              <CardDescription>記事内で使用する画像をアップロードしてください。アップロード後、本文エディタの画像挿入ボタンから挿入できます。</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                mode="immediate"
                previewSize="small"
                maxFiles={10}
                folder="article-images"
                value={contentImages}
                onUpload={setContentImages}
                onDelete={(fileId) => {
                  setContentImages(prev => prev.filter(f => f.id !== fileId))
                }}
                onError={(error) => toast.error(error)}
                imageProcessingOptions={PRESET_ARTICLE}
                sequentialProcessing
              />
            </CardContent>
          </Card>

          {/* 本文 */}
          <ContentEditor isSubmitting={isSubmitting} />

          {/* カテゴリ・タグ選択 */}
          <CategoryTagSelector
            initialCategories={initialCategories}
            initialTags={initialTags}
            selectedCategoryIds={selectedCategoryIds}
            selectedTagIds={selectedTagIds}
            onCategoriesChange={setSelectedCategoryIds}
            onTagsChange={setSelectedTagIds}
          />

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? '保存中...' : article ? '更新' : '作成'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              .mdでエクスポート
            </Button>
          </div>
      </form>
    </Form>
  )
}