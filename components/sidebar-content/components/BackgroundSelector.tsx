'use client'

import { useState, useTransition } from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { updateThemeBackground } from '@/app/actions/user/theme-actions'
import { toast } from 'sonner'
import type { BackgroundSettings } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'
import { Check, Upload, Trash2 } from 'lucide-react'

// プリセット背景色
const PRESET_COLORS = [
  { value: '#f8fafc', label: 'ホワイト' },
  { value: '#f1f5f9', label: 'スレートグレー' },
  { value: '#fef3c7', label: 'ウォームイエロー' },
  { value: '#dbeafe', label: 'ライトブルー' },
  { value: '#fce7f3', label: 'ピンク' },
  { value: '#d1fae5', label: 'ミント' },
  { value: '#1e293b', label: 'ダーク' },
]

interface BackgroundSelectorProps {
  currentBackground?: BackgroundSettings
}

export function BackgroundSelector({
  currentBackground,
}: BackgroundSelectorProps) {
  const [isPending, startTransition] = useTransition()
  const [bgType, setBgType] = useState<'preset' | 'color' | 'image'>(
    currentBackground?.type || 'preset'
  )
  const [selectedColor, setSelectedColor] = useState(
    currentBackground?.color || PRESET_COLORS[0].value
  )
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [showUploader, setShowUploader] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleTypeChange = (type: 'preset' | 'color' | 'image') => {
    setBgType(type)
  }

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  const handleSave = () => {
    startTransition(async () => {
      let background: BackgroundSettings | undefined

      if (bgType === 'preset') {
        background = { type: 'preset' }
      } else if (bgType === 'color') {
        background = { type: 'color', color: selectedColor }
      } else if (bgType === 'image' && uploadedFiles.length > 0) {
        background = {
          type: 'image',
          imageKey: uploadedFiles[0].key,
          imageSource: 'user',
        }
      }

      const result = await updateThemeBackground(background)

      if (result.success) {
        toast.success('背景設定を更新しました')
        // ページをリロードして変更を反映
        window.location.reload()
      } else {
        toast.error(result.error || '背景設定の更新に失敗しました')
      }
    })
  }

  // 背景画像削除処理
  const handleDeleteBackground = () => {
    setIsDeleting(true)
    startTransition(async () => {
      // 背景をpresetに戻す（画像も削除される）
      const result = await updateThemeBackground({ type: 'preset' })

      if (result.success) {
        toast.success('背景画像を削除しました')
        window.location.reload()
      } else {
        toast.error(result.error || '背景画像の削除に失敗しました')
      }
      setIsDeleting(false)
    })
  }

  return (
    <div className="space-y-4">
      {/* 背景タイプ選択 */}
      <RadioGroup
        value={bgType}
        onValueChange={(v) => handleTypeChange(v as 'preset' | 'color' | 'image')}
        className="space-y-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="preset" id="bg-preset" />
          <Label htmlFor="bg-preset" className="text-sm">
            テーマに従う
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="color" id="bg-color" />
          <Label htmlFor="bg-color" className="text-sm">
            カスタム色
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="image" id="bg-image" />
          <Label htmlFor="bg-image" className="text-sm">
            背景画像
          </Label>
        </div>
      </RadioGroup>

      {/* カスタム色選択 */}
      {bgType === 'color' && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">プリセットカラー</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorSelect(color.value)}
                className={`
                  w-10 h-10 rounded-lg border-2 transition-all relative
                  ${selectedColor === color.value ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'}
                `}
                style={{ backgroundColor: color.value }}
                title={color.label}
              >
                {selectedColor === color.value && (
                  <Check
                    className={`absolute inset-0 m-auto w-4 h-4 ${
                      color.value === '#1e293b' ? 'text-white' : 'text-gray-700'
                    }`}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="custom-color" className="text-xs whitespace-nowrap">
              カスタム:
            </Label>
            <Input
              id="custom-color"
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-12 h-8 p-1 cursor-pointer"
            />
            <Input
              type="text"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="flex-1 h-8 text-xs"
              placeholder="#ffffff"
            />
          </div>
        </div>
      )}

      {/* 背景画像アップロード */}
      {bgType === 'image' && (
        <div className="space-y-3">
          {currentBackground?.imageKey && !showUploader && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">現在の背景画像</p>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                <img
                  src={`/api/files/${currentBackground.imageKey}`}
                  alt="現在の背景"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUploader(true)}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  変更
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteBackground}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isDeleting ? '削除中...' : '削除'}
                </Button>
              </div>
            </div>
          )}

          {(!currentBackground?.imageKey || showUploader) && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                推奨: 1920×1080px (16:9)
              </p>
              <ImageUploader
                mode="immediate"
                maxFiles={1}
                maxSize={10 * 1024 * 1024} // 10MB
                folder="backgrounds"
                previewSize={{ width: 220, height: 124 }}
                value={uploadedFiles}
                onUpload={setUploadedFiles}
              />
            </div>
          )}
        </div>
      )}

      {/* 保存ボタン */}
      <Button
        onClick={handleSave}
        disabled={isPending || (bgType === 'image' && uploadedFiles.length === 0 && !currentBackground?.imageKey)}
        className="w-full"
      >
        {isPending ? '保存中...' : '背景を適用'}
      </Button>
    </div>
  )
}
