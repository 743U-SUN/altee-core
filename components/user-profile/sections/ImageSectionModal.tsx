'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { EditModal } from '../EditModal'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import type { ImageSectionData } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'
import { Trash2, Check } from 'lucide-react'

// プリセット背景色
const PRESET_COLORS = [
  { value: '#f8fafc', label: 'ホワイト' },
  { value: '#f1f5f9', label: 'グレー' },
  { value: '#fef3c7', label: 'イエロー' },
  { value: '#dbeafe', label: 'ブルー' },
  { value: '#fce7f3', label: 'ピンク' },
  { value: '#1e293b', label: 'ダーク' },
]

interface ImageSectionModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: ImageSectionData
}

export function ImageSectionModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: ImageSectionModalProps) {
  const [isPending, startTransition] = useTransition()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [altText, setAltText] = useState(currentData.altText || '')
  const [aspectRatio, setAspectRatio] = useState<string>(currentData.aspectRatio || '16:9')
  const [objectFit, setObjectFit] = useState<string>(currentData.objectFit || 'cover')
  const [borderRadius, setBorderRadius] = useState<string>(currentData.borderRadius || 'md')

  // 背景設定
  const [bgType, setBgType] = useState<'transparent' | 'color' | 'image'>(
    currentData.background?.type || 'transparent'
  )
  const [bgColor, setBgColor] = useState(currentData.background?.color || PRESET_COLORS[0].value)
  const [bgUploadedFiles, setBgUploadedFiles] = useState<UploadedFile[]>([])

  const handleSave = () => {
    startTransition(async () => {
      const newData: ImageSectionData = {
        imageKey: uploadedFiles.length > 0 ? uploadedFiles[0].key : currentData.imageKey,
        altText,
        aspectRatio: aspectRatio as ImageSectionData['aspectRatio'],
        objectFit: objectFit as ImageSectionData['objectFit'],
        borderRadius: borderRadius as ImageSectionData['borderRadius'],
      }

      // 背景設定
      if (bgType === 'transparent') {
        newData.background = { type: 'transparent' }
      } else if (bgType === 'color') {
        newData.background = { type: 'color', color: bgColor }
      } else if (bgType === 'image' && (bgUploadedFiles.length > 0 || currentData.background?.imageKey)) {
        newData.background = {
          type: 'image',
          imageKey: bgUploadedFiles.length > 0 ? bgUploadedFiles[0].key : currentData.background?.imageKey,
        }
      }

      const result = await updateSection(sectionId, { data: newData })

      if (result.success) {
        toast.success('画像セクションを更新しました')
        onClose()
        window.location.reload()
      } else {
        toast.error(result.error || '更新に失敗しました')
      }
    })
  }

  const handleDeleteImage = () => {
    startTransition(async () => {
      const newData: ImageSectionData = {
        ...currentData,
        imageKey: undefined,
      }

      const result = await updateSection(sectionId, { data: newData })

      if (result.success) {
        toast.success('画像を削除しました')
        onClose()
        window.location.reload()
      } else {
        toast.error(result.error || '削除に失敗しました')
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="画像セクションを編集"
      hideActions
    >
      <div className="space-y-6">
        {/* 画像アップロード */}
        <div className="space-y-2">
          <Label>画像</Label>
          <p className="text-xs text-muted-foreground">
            推奨: 1920×1080px (16:9)
          </p>

          {currentData.imageKey && uploadedFiles.length === 0 && (
            <div className="space-y-2">
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                <Image
                  src={`/api/files/${currentData.imageKey}`}
                  alt={currentData.altText || '現在の画像'}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteImage}
                disabled={isPending}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                画像を削除
              </Button>
            </div>
          )}

          <ImageUploader
            mode="immediate"
            maxFiles={1}
            maxSize={10 * 1024 * 1024}
            folder="section-images"
            previewSize="large"
            value={uploadedFiles}
            onUpload={setUploadedFiles}
          />
        </div>

        {/* altテキスト */}
        <div className="space-y-2">
          <Label htmlFor="alt-text">代替テキスト（任意）</Label>
          <Input
            id="alt-text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="画像の説明"
          />
        </div>

        {/* 表示設定 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>アスペクト比</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9（横長）</SelectItem>
                <SelectItem value="3:1">3:1（バナー）</SelectItem>
                <SelectItem value="4:3">4:3</SelectItem>
                <SelectItem value="1:1">1:1（正方形）</SelectItem>
                <SelectItem value="auto">自動</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>角丸</Label>
            <Select value={borderRadius} onValueChange={setBorderRadius}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">なし</SelectItem>
                <SelectItem value="sm">小</SelectItem>
                <SelectItem value="md">中</SelectItem>
                <SelectItem value="lg">大</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 背景設定 */}
        <div className="space-y-3 pt-4 border-t">
          <Label>背景設定</Label>
          <RadioGroup
            value={bgType}
            onValueChange={(v) => setBgType(v as typeof bgType)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="transparent" id="bg-transparent" />
              <Label htmlFor="bg-transparent" className="text-sm">
                透明（全体背景が見える）
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="color" id="bg-color" />
              <Label htmlFor="bg-color" className="text-sm">
                背景色
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="bg-image" />
              <Label htmlFor="bg-image" className="text-sm">
                背景画像
              </Label>
            </div>
          </RadioGroup>

          {/* 背景色選択 */}
          {bgType === 'color' && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setBgColor(color.value)}
                    className={`
                      w-8 h-8 rounded border-2 transition-all relative
                      ${bgColor === color.value ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.label}
                  >
                    {bgColor === color.value && (
                      <Check
                        className={`absolute inset-0 m-auto w-3 h-3 ${
                          color.value === '#1e293b' ? 'text-white' : 'text-gray-700'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
              <Input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-full h-8"
              />
            </div>
          )}

          {/* 背景画像アップロード */}
          {bgType === 'image' && (
            <div className="space-y-2">
              {currentData.background?.imageKey && bgUploadedFiles.length === 0 && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                  <Image
                    src={`/api/files/${currentData.background.imageKey}`}
                    alt="現在の背景"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              )}
              <ImageUploader
                mode="immediate"
                maxFiles={1}
                maxSize={10 * 1024 * 1024}
                folder="section-backgrounds"
                previewSize="medium"
                value={bgUploadedFiles}
                onUpload={setBgUploadedFiles}
              />
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1"
          >
            {isPending ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </EditModal>
  )
}
