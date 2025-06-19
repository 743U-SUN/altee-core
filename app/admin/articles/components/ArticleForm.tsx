'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { createArticle, updateArticle } from '@/app/actions/article-actions'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { UploadedFile } from '@/types/image-upload'
import { downloadMarkdownFile, createExportDataFromForm, createExportDataFromArticle } from '@/lib/markdown-export'
import { BasicInfoSection } from './BasicInfoSection'
import { ContentEditor } from './ContentEditor'
import { SidebarSection } from './SidebarSection'
import type { FormValues, Article } from './types'

const formSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
  slug: z.string().min(1, 'スラッグは必須です').max(255, 'スラッグは255文字以内で入力してください'),
  content: z.string().min(1, 'コンテンツは必須です'),
  excerpt: z.string().max(500, '要約は500文字以内で入力してください'),
  published: z.boolean(),
})
// Note: サムネイル画像は独立管理（thumbnailステート）

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
              <BasicInfoSection
                control={form.control}
                onTitleChange={handleTitleChange}
                onSlugChange={handleSlugChange}
              />

              <ContentEditor
                control={form.control}
                isSubmitting={isSubmitting}
              />
            </div>

            {/* サイドバー */}
            <SidebarSection
              control={form.control}
              isSubmitting={isSubmitting}
              article={article}
              thumbnail={thumbnail}
              onThumbnailChange={setThumbnail}
              onExport={handleExport}
              onThumbnailError={(error) => toast.error(error)}
            />
          </div>
        </form>
      </Form>
    </div>
  )
}