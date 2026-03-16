'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { updateSection } from '@/app/actions/user/section-actions'
import { deleteImageAction } from '@/app/actions/media/image-upload-actions'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { toast } from 'sonner'
import type { ImageHeroData, ImageGridItem, SpeechBubbleItem } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { PRESET_MOBILE_BG, PRESET_PORTRAIT } from '@/lib/image-uploader/image-processing-presets'
import { nanoid } from 'nanoid'
import { ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react'

const MAX_SPEECHES = 10
const MAX_SPEECH_LENGTH = 50

interface ImageHeroEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: ImageHeroData
}

export function ImageHeroEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: ImageHeroEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // PC背景画像
  const [item, setItem] = useState<ImageGridItem>(() => ({
    id: currentData.item?.id || nanoid(),
    imageKey: currentData.item?.imageKey,
    sortOrder: 0,
  }))

  // モバイル背景画像
  const [mobileImageKey, setMobileImageKey] = useState<string | undefined>(
    () => currentData.mobileImageKey
  )

  // キャラクター画像
  const [characterImageKey, setCharacterImageKey] = useState<string | undefined>(
    () => currentData.characterImageKey
  )

  // セリフ
  const [speeches, setSpeeches] = useState<SpeechBubbleItem[]>(
    () => [...(currentData.speeches ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)
  )

  // 表示モード
  const [speechDisplayMode, setSpeechDisplayMode] = useState<'sequential' | 'random'>(
    () => currentData.speechDisplayMode ?? 'sequential'
  )

  // --- PC画像アップロード値 ---
  const uploadValue = useMemo<UploadedFile[]>(() => {
    if (!item.imageKey) return []
    return [{
      id: item.id,
      name: item.imageKey,
      originalName: item.imageKey,
      url: getPublicUrl(item.imageKey),
      key: item.imageKey,
      size: 0,
      type: 'image/jpeg',
      uploadedAt: new Date().toISOString(),
    }]
  }, [item.imageKey, item.id])

  // --- モバイル画像アップロード値 ---
  const mobileUploadValue = useMemo<UploadedFile[]>(() => {
    if (!mobileImageKey) return []
    return [{
      id: `mobile-${item.id}`,
      name: mobileImageKey,
      originalName: mobileImageKey,
      url: getPublicUrl(mobileImageKey),
      key: mobileImageKey,
      size: 0,
      type: 'image/webp',
      uploadedAt: new Date().toISOString(),
    }]
  }, [mobileImageKey, item.id])

  // --- キャラクター画像アップロード値 ---
  const characterUploadValue = useMemo<UploadedFile[]>(() => {
    if (!characterImageKey) return []
    return [{
      id: `character-${item.id}`,
      name: characterImageKey,
      originalName: characterImageKey,
      url: getPublicUrl(characterImageKey),
      key: characterImageKey,
      size: 0,
      type: 'image/png',
      uploadedAt: new Date().toISOString(),
    }]
  }, [characterImageKey, item.id])

  // --- PC画像ハンドラ ---
  const handleUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setItem(prev => ({ ...prev, imageKey: files[0].key }))
    }
  }

  const handleDelete = async (fileId: string) => {
    const file = uploadValue.find(f => f.id === fileId)
    if (file?.key) {
      await deleteImageAction(file.key)
    }
    setItem(prev => ({ ...prev, imageKey: undefined }))
  }

  // --- モバイル画像ハンドラ ---
  const handleMobileUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setMobileImageKey(files[0].key)
    }
  }

  const handleMobileDelete = async (fileId: string) => {
    const file = mobileUploadValue.find(f => f.id === fileId)
    if (file?.key) {
      await deleteImageAction(file.key)
    }
    setMobileImageKey(undefined)
  }

  // --- キャラクター画像ハンドラ ---
  const handleCharacterUpload = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setCharacterImageKey(files[0].key)
    }
  }

  const handleCharacterDelete = async (fileId: string) => {
    const file = characterUploadValue.find(f => f.id === fileId)
    if (file?.key) {
      await deleteImageAction(file.key)
    }
    setCharacterImageKey(undefined)
  }

  // --- セリフ操作 ---
  const handleAddSpeech = useCallback(() => {
    if (speeches.length >= MAX_SPEECHES) return
    const newSpeech: SpeechBubbleItem = {
      id: nanoid(),
      text: '',
      sortOrder: speeches.length,
    }
    setSpeeches(prev => [...prev, newSpeech])
  }, [speeches.length])

  const updateSpeechText = useCallback((id: string, text: string) => {
    setSpeeches(prev =>
      prev.map(s => s.id === id ? { ...s, text: text.slice(0, MAX_SPEECH_LENGTH) } : s)
    )
  }, [])

  const deleteSpeech = useCallback((id: string) => {
    setSpeeches(prev =>
      prev.filter(s => s.id !== id).map((s, i) => ({ ...s, sortOrder: i }))
    )
  }, [])

  const moveSpeech = useCallback((index: number, direction: 'up' | 'down') => {
    setSpeeches(prev => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next.map((s, i) => ({ ...s, sortOrder: i }))
    })
  }, [])

  // --- 保存 ---
  const handleSave = () => {
    startTransition(async () => {
      try {
        const newData: ImageHeroData = {
          item: { id: item.id, imageKey: item.imageKey, sortOrder: 0 },
          mobileImageKey,
          characterImageKey,
          speeches: speeches.length > 0 ? speeches : undefined,
          speechDisplayMode: speeches.length > 0 ? speechDisplayMode : undefined,
        }
        const result = await updateSection(sectionId, { data: newData })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '更新に失敗しました')
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
      }
    })
  }

  return (
    <EditModal isOpen={isOpen} onClose={onClose} title="ヒーロー画像を編集" hideActions>
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images">画像</TabsTrigger>
          <TabsTrigger value="speeches">セリフ</TabsTrigger>
        </TabsList>

        {/* 画像タブ */}
        <TabsContent value="images" className="mt-4 space-y-6">
          {/* PC用画像アップロード */}
          <div className="space-y-2">
            <Label>PC用背景画像</Label>
            <ImageUploader
              mode="immediate"
              previewSize={{ width: 400, height: 225 }}
              maxFiles={1}
              folder="section-images"
              value={uploadValue}
              onUpload={handleUpload}
              onDelete={handleDelete}
            />
            <p className="text-xs text-muted-foreground">
              推奨サイズ: 16:9（例: 1920x1080px）
            </p>
          </div>

          {/* モバイル/タブレット用画像アップロード */}
          <div className="space-y-2">
            <Label>モバイル/タブレット用背景画像</Label>
            <ImageUploader
              mode="immediate"
              previewSize={{ width: 200, height: 267 }}
              maxFiles={1}
              folder="section-images"
              value={mobileUploadValue}
              onUpload={handleMobileUpload}
              onDelete={handleMobileDelete}
              imageProcessingOptions={PRESET_MOBILE_BG}
            />
            <p className="text-xs text-muted-foreground">
              推奨サイズ: 3:4（例: 810x1080px）。未設定の場合はPC画像を使用します。
            </p>
          </div>

          {/* キャラクター画像アップロード */}
          <div className="space-y-2">
            <Label>キャラクター画像</Label>
            <ImageUploader
              mode="immediate"
              previewSize={{ width: 135, height: 240 }}
              maxFiles={1}
              folder="section-images"
              value={characterUploadValue}
              onUpload={handleCharacterUpload}
              onDelete={handleCharacterDelete}
              imageProcessingOptions={PRESET_PORTRAIT}
            />
            <p className="text-xs text-muted-foreground">
              推奨サイズ: 9:16（例: 720x1280px）。背景画像の中央下に配置されます。
            </p>
          </div>
        </TabsContent>

        {/* セリフタブ */}
        <TabsContent value="speeches" className="mt-4 space-y-4">
          {/* 表示モード */}
          <div className="space-y-2">
            <Label>表示モード</Label>
            <RadioGroup
              value={speechDisplayMode}
              onValueChange={(v) => setSpeechDisplayMode(v as 'sequential' | 'random')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sequential" id="mode-seq" />
                <Label htmlFor="mode-seq" className="font-normal">順番に表示</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="random" id="mode-rand" />
                <Label htmlFor="mode-rand" className="font-normal">ランダム表示</Label>
              </div>
            </RadioGroup>
          </div>

          {/* セリフリスト */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>セリフ一覧（{speeches.length}/{MAX_SPEECHES}）</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddSpeech}
                disabled={speeches.length >= MAX_SPEECHES}
              >
                <Plus className="w-4 h-4 mr-1" />
                追加
              </Button>
            </div>

            {speeches.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                セリフが登録されていません。「追加」ボタンから登録してください。
              </p>
            )}

            {speeches.map((speech, index) => (
              <div key={speech.id} className="flex items-start gap-2 p-3 border rounded-lg">
                <div className="flex flex-col gap-1 pt-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => moveSpeech(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => moveSpeech(index, 'down')}
                    disabled={index === speeches.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1">
                  <Textarea
                    value={speech.text}
                    onChange={(e) => updateSpeechText(speech.id, e.target.value)}
                    placeholder="セリフを入力..."
                    maxLength={MAX_SPEECH_LENGTH}
                    rows={2}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {speech.text.length}/{MAX_SPEECH_LENGTH}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 mt-1"
                  onClick={() => deleteSpeech(speech.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 保存ボタン（タブ外・共通） */}
      <div className="flex gap-2 pt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isPending}
          className="flex-1"
        >
          キャンセル
        </Button>
        <Button onClick={handleSave} disabled={isPending} className="flex-1">
          {isPending ? '処理中...' : '完了'}
        </Button>
      </div>
    </EditModal>
  )
}
