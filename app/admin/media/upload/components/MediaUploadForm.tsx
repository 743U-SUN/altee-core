'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import type { UploadedFile } from '@/types/image-upload'
import { uploadMediaFileAction } from '@/app/actions/media-upload-actions'
import { MediaType } from '@prisma/client'
import { toast } from 'sonner'

const uploadSchema = z.object({
  uploadType: z.enum(['THUMBNAIL', 'CONTENT', 'SYSTEM', 'ICON']),
  description: z.string().optional(),
  altText: z.string().optional(),
  tags: z.string().optional(),
})

type AdminMediaType = 'THUMBNAIL' | 'CONTENT' | 'SYSTEM' | 'ICON'

type UploadFormData = z.infer<typeof uploadSchema>

export function MediaUploadForm() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      uploadType: 'CONTENT',
      description: '',
      altText: '',
      tags: '',
    },
  })

  // ファイルアップロード後の処理
  const handleFileUpload = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }


  const onSubmit = async (data: UploadFormData) => {
    if (uploadedFiles.length === 0) {
      toast.error('ファイルを選択してください。')
      return
    }

    setIsSubmitting(true)

    try {
      // 最新のアップロードファイル
      const latestFile = uploadedFiles[uploadedFiles.length - 1]
      
      if (!latestFile) {
        throw new Error('アップロード済みファイルが見つかりません')
      }
      
      // タグの処理（カンマ区切り文字列を配列に変換）
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : []

      // batchモードでは元のFileオブジェクトが含まれている
      if (!latestFile.file) {
        throw new Error('ファイルデータが見つかりません。ファイルを再選択してください。')
      }

      let fileToUpload = latestFile.file

      // 画像ファイルの場合は最適化処理を実行
      if (latestFile.file.type.startsWith('image/') && 
          latestFile.file.type !== 'image/svg+xml' && 
          latestFile.file.type !== 'image/gif') {
        try {
          const { processImage } = await import('@/lib/image-uploader/image-processor')
          const processResult = await processImage(latestFile.file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'webp'
          })
          
          if (processResult.success && processResult.processedFile) {
            // WebPファイルとして新しいFileオブジェクトを作成
            const webpFileName = latestFile.file.name.replace(/\.[^.]+$/, '.webp')
            fileToUpload = new File([processResult.processedFile], webpFileName, {
              type: 'image/webp'
            })
          }
        } catch (error) {
          console.warn('Image processing failed, using original file:', error)
          // 処理に失敗した場合は元のファイルを使用
        }
      }

      // メタデータ付きでアップロード（新しいServer Actionを呼び出し）
      const formData = new FormData()
      formData.append('file', fileToUpload)
      
      const result = await uploadMediaFileAction(formData, {
        uploadType: data.uploadType as MediaType,
        description: data.description || undefined,
        altText: data.altText || undefined,
        tags: tags.length > 0 ? tags : undefined,
      })

      if (!result) {
        throw new Error('アップロード処理でエラーが発生しました')
      }

      if (result.success) {
        toast.success('ファイルのアップロードとメタデータの保存が完了しました。')
        
        // フォームをリセット
        form.reset()
        setUploadedFiles([])
      } else {
        toast.error(result?.error || 'アップロードに失敗しました。')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'アップロード中にエラーが発生しました。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ファイルアップロード</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* アップロード用途選択 */}
            <div className="space-y-3">
              <Label>アップロード用途</Label>
              <RadioGroup
                value={form.watch('uploadType')}
                onValueChange={(value) => form.setValue('uploadType', value as AdminMediaType)}
                className="flex flex-row space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="THUMBNAIL" id="thumbnail" />
                  <Label htmlFor="thumbnail">記事サムネイル</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CONTENT" id="content" />
                  <Label htmlFor="content">記事内画像</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SYSTEM" id="system" />
                  <Label htmlFor="system">システム画像</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ICON" id="icon" />
                  <Label htmlFor="icon">カスタムアイコン</Label>
                </div>
              </RadioGroup>
            </div>

            {/* ファイルアップロード */}
            <div className="space-y-3">
              <Label>画像ファイル</Label>
              <ImageUploader
                mode="batch"
                previewSize="large"
                maxFiles={1}
                value={uploadedFiles}
                onUpload={handleFileUpload}
                onError={(error) => {
                  toast.error(error)
                }}
              />
            </div>

            {/* メタデータ入力 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">説明文（オプション）</Label>
                <Textarea
                  id="description"
                  placeholder="画像の説明を入力..."
                  {...form.register('description')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="altText">Altテキスト（オプション）</Label>
                <Input
                  id="altText"
                  placeholder="Alt属性用のテキスト..."
                  {...form.register('altText')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">タグ（オプション）</Label>
              <Input
                id="tags"
                placeholder="タグをカンマ区切りで入力（例: hero, mobile, v2）"
                {...form.register('tags')}
              />
            </div>

            {/* アップロードボタン */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'アップロード中...' : 'メタデータを追加してアップロード'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}