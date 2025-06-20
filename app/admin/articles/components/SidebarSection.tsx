'use client'

import { Control } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { Save, Download } from 'lucide-react'
import type { UploadedFile } from '@/types/image-upload'
import type { FormValues, Article } from './types'

interface SidebarSectionProps {
  control: Control<FormValues>
  isSubmitting: boolean
  article?: Article
  thumbnail: UploadedFile[]
  onThumbnailChange: (files: UploadedFile[]) => void
  onExport: () => void
  onThumbnailError: (error: string) => void
  contentImages: UploadedFile[]
  onContentImagesChange: (files: UploadedFile[]) => void
  onContentImagesError: (error: string) => void
}

export function SidebarSection({ 
  control, 
  isSubmitting, 
  article, 
  thumbnail, 
  onThumbnailChange, 
  onExport, 
  onThumbnailError,
  onContentImagesChange,
  onContentImagesError
}: SidebarSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>公開設定</CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={control}
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
            onUpload={onThumbnailChange}
            onError={onThumbnailError}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>記事内画像</CardTitle>
          <CardDescription>記事内で使用する画像をアップロードしてください。</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader
            mode="immediate"
            previewSize="small"
            maxFiles={10}
            folder="article-images"
            value={[]}
            showPreview={false}
            onUpload={(files) => {
              // アップロード完了時の通知のみ
              if (files.length > 0) {
                onContentImagesChange([])
              }
            }}
            onError={onContentImagesError}
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
          onClick={onExport}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          .mdでエクスポート
        </Button>
      </div>
    </div>
  )
}