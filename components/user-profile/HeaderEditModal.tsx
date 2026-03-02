'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import {
  updateUserProfile,
  updateThemeSettings,
  getNamecardImages,
} from '@/app/actions/user/profile-actions'
import { toast } from 'sonner'
import { EditModal } from './EditModal'
import type { UploadedFile } from '@/types/image-upload'
import type { ThemeSettings } from '@/types/profile-sections'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { Trash2, Check, RotateCcw } from 'lucide-react'
import Image from 'next/image'

interface NamecardImage {
  id: string
  storageKey: string
  fileName: string
  originalName: string
  description: string | null
  altText: string | null
}

interface HeaderEditModalProps {
  isOpen: boolean
  onClose: () => void
  currentAvatarImageUrl?: string | null
  currentCharacterName?: string | null
  currentThemeSettings: ThemeSettings
}

// ネームカードの背景タイプ（none = デフォルトに戻す）
type NamecardType = 'preset' | 'color' | 'image' | 'none'

// 背景色のプリセットパレット
const PRESET_BG_COLORS = [
  '#ffffff',
  '#1a1a2e',
  '#16213e',
  '#0f3460',
  '#533483',
  '#e94560',
]

// 文字色のプリセットパレット
const PRESET_TEXT_COLORS = [
  '#ffffff',
  '#000000',
  '#111827',
  '#374151',
  '#6b7280',
  '#f9fafb',
]

/**
 * ヘッダー編集モーダル（アイコン / キャラクター名 / ネームカード）
 */
export function HeaderEditModal({
  isOpen,
  onClose,
  currentAvatarImageUrl,
  currentCharacterName,
  currentThemeSettings,
}: HeaderEditModalProps) {
  const router = useRouter()

  // --- アイコンタブの状態 ---
  const [avatarUploadedFiles, setAvatarUploadedFiles] = useState<UploadedFile[]>([])
  const [isAvatarSaving, setIsAvatarSaving] = useState(false)
  const [isAvatarDeleting, setIsAvatarDeleting] = useState(false)

  // --- キャラクター名タブの状態 ---
  const [characterName, setCharacterName] = useState(currentCharacterName || '')
  const [isNameSaving, setIsNameSaving] = useState(false)

  // --- ネームカードタブの状態 ---
  const savedNamecard = currentThemeSettings.namecard
  const [namecardType, setNamecardType] = useState<NamecardType>(
    savedNamecard?.type ?? 'none'
  )
  const [selectedBgColor, setSelectedBgColor] = useState(
    savedNamecard?.color ?? '#ffffff'
  )
  const [selectedPresetKey, setSelectedPresetKey] = useState(
    savedNamecard?.imageKey ?? ''
  )
  const [selectedTextColor, setSelectedTextColor] = useState(
    savedNamecard?.textColor ?? ''
  )
  const [namecardUploadedFiles, setNamecardUploadedFiles] = useState<UploadedFile[]>([])
  const [presetImages, setPresetImages] = useState<NamecardImage[]>([])
  const [isPresetsLoading, setIsPresetsLoading] = useState(false)
  const [isNamecardSaving, setIsNamecardSaving] = useState(false)
  const [isNamecardImageDeleting, setIsNamecardImageDeleting] = useState(false)

  // モーダルが閉じた時にアップロード状態をリセット
  useEffect(() => {
    if (!isOpen) {
      setAvatarUploadedFiles([])
      setIsAvatarSaving(false)
      setIsAvatarDeleting(false)
      setCharacterName(currentCharacterName || '')
      setIsNameSaving(false)
      setNamecardUploadedFiles([])
      setIsNamecardSaving(false)
      setIsNamecardImageDeleting(false)
    }
  }, [isOpen, currentCharacterName])

  // ネームカードタブを開いたときにプリセット画像を取得
  const handleTabChange = async (tab: string) => {
    if (tab === 'namecard' && presetImages.length === 0) {
      setIsPresetsLoading(true)
      try {
        const result = await getNamecardImages()
        if (result.success && result.data) {
          setPresetImages(result.data)
        }
      } catch {
        toast.error('ネームカード画像の取得に失敗しました')
      } finally {
        setIsPresetsLoading(false)
      }
    }
  }

  // --- アイコン保存 ---
  const handleAvatarSave = async () => {
    if (avatarUploadedFiles.length === 0) {
      toast.error('画像を選択してください')
      return
    }
    setIsAvatarSaving(true)
    try {
      const result = await updateUserProfile({
        avatarImageId: avatarUploadedFiles[0].id,
      })
      if (result.success) {
        toast.success('アイコンを更新しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'アイコンの更新に失敗しました')
      }
    } catch {
      toast.error('アイコンの更新中にエラーが発生しました')
    } finally {
      setIsAvatarSaving(false)
    }
  }

  // --- アイコン削除 ---
  const handleAvatarDelete = async () => {
    setIsAvatarDeleting(true)
    try {
      const result = await updateUserProfile({ avatarImageId: null })
      if (result.success) {
        toast.success('アイコンを削除しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'アイコンの削除に失敗しました')
      }
    } catch {
      toast.error('アイコンの削除中にエラーが発生しました')
    } finally {
      setIsAvatarDeleting(false)
    }
  }

  // --- キャラクター名保存 ---
  const handleNameSave = async () => {
    if (!characterName.trim()) {
      toast.error('キャラクター名を入力してください')
      return
    }
    setIsNameSaving(true)
    try {
      const result = await updateUserProfile({ characterName: characterName.trim() })
      if (result.success) {
        toast.success('キャラクター名を更新しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'キャラクター名の更新に失敗しました')
      }
    } catch {
      toast.error('キャラクター名の更新中にエラーが発生しました')
    } finally {
      setIsNameSaving(false)
    }
  }

  // --- ネームカード画像削除（R2 + DB + themeSettings リセット）---
  const handleNamecardImageDelete = async () => {
    setIsNamecardImageDeleting(true)
    try {
      const result = await updateThemeSettings(null)
      if (result.success) {
        toast.success('ネームカード画像を削除しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || '削除に失敗しました')
      }
    } catch {
      toast.error('削除中にエラーが発生しました')
    } finally {
      setIsNamecardImageDeleting(false)
    }
  }

  // --- ネームカード保存 ---
  const handleNamecardSave = async () => {
    setIsNamecardSaving(true)
    try {
      // デフォルトに戻す（namecard を削除）
      if (namecardType === 'none') {
        const result = await updateThemeSettings(null)
        if (result.success) {
          toast.success('ネームカードをデフォルトに戻しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || 'ネームカードの更新に失敗しました')
        }
        return
      }

      const textColor = selectedTextColor || undefined

      let namecard: NonNullable<ThemeSettings['namecard']>

      if (namecardType === 'color') {
        namecard = { type: 'color', color: selectedBgColor, textColor }
      } else if (namecardType === 'preset') {
        if (!selectedPresetKey) {
          toast.error('画像を選択してください')
          return
        }
        namecard = { type: 'preset', imageKey: selectedPresetKey, textColor }
      } else {
        // image（カスタムアップロード）
        if (namecardUploadedFiles.length > 0) {
          // 新しい画像がアップロードされた場合
          namecard = { type: 'image', imageKey: namecardUploadedFiles[0].key, textColor }
        } else if (savedNamecard?.imageKey) {
          // 既存の画像を再利用（変更なし）
          namecard = { type: 'image', imageKey: savedNamecard.imageKey, textColor }
        } else {
          toast.error('画像をアップロードしてください')
          return
        }
      }

      const result = await updateThemeSettings(namecard)
      if (result.success) {
        toast.success('ネームカードを更新しました')
        onClose()
        router.refresh()
      } else {
        toast.error(result.error || 'ネームカードの更新に失敗しました')
      }
    } catch {
      toast.error('ネームカードの更新中にエラーが発生しました')
    } finally {
      setIsNamecardSaving(false)
    }
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="ヘッダーを編集"
      hideActions
    >
      <Tabs
        defaultValue="avatar"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="avatar">アイコン</TabsTrigger>
          <TabsTrigger value="name">キャラクター名</TabsTrigger>
          <TabsTrigger value="namecard">ネームカード</TabsTrigger>
        </TabsList>

        {/* ─── Tab 1: アイコン ─── */}
        <TabsContent value="avatar" className="mt-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              推奨: 500×500px 正方形
            </p>

            {currentAvatarImageUrl && avatarUploadedFiles.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">現在のアイコン</p>
                <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden">
                  <Image
                    src={currentAvatarImageUrl}
                    alt="現在のアイコン"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
                <Button
                  variant="destructive"
                  onClick={handleAvatarDelete}
                  disabled={isAvatarDeleting}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {isAvatarDeleting ? '削除中...' : 'アイコンを削除'}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {currentAvatarImageUrl && avatarUploadedFiles.length === 0
                  ? '新しいアイコンをアップロード'
                  : 'アイコンをアップロード'}
              </p>
              <ImageUploader
                mode="immediate"
                maxFiles={1}
                maxSize={5 * 1024 * 1024}
                folder="user-icons"
                previewSize={{ width: 80, height: 80 }}
                rounded={true}
                value={avatarUploadedFiles}
                onUpload={setAvatarUploadedFiles}
              />
            </div>

            {avatarUploadedFiles.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isAvatarSaving}
                  className="flex-1"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleAvatarSave}
                  disabled={isAvatarSaving}
                  className="flex-1"
                >
                  {isAvatarSaving ? '保存中...' : '保存'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Tab 2: キャラクター名 ─── */}
        <TabsContent value="name" className="mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="character-name">キャラクター名</Label>
              <Input
                id="character-name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                maxLength={30}
                placeholder="キャラクター名を入力"
              />
              <p className="text-xs text-muted-foreground text-right">
                {characterName.length} / 30
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isNameSaving}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleNameSave}
                disabled={isNameSaving || !characterName.trim()}
                className="flex-1"
              >
                {isNameSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── Tab 3: ネームカード ─── */}
        <TabsContent value="namecard" className="mt-4">
          <div className="space-y-4">
            <RadioGroup
              value={namecardType}
              onValueChange={(v) => setNamecardType(v as NamecardType)}
            >
              {/* A: プリセット画像 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="preset" id="nc-preset" />
                  <Label htmlFor="nc-preset">プリセット画像</Label>
                </div>
                {namecardType === 'preset' && (
                  <div className="pl-6">
                    {isPresetsLoading ? (
                      <p className="text-sm text-muted-foreground py-2">読み込み中...</p>
                    ) : presetImages.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        まだ画像がありません
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {presetImages.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedPresetKey(img.storageKey)}
                            className={`relative w-full aspect-[4/1] rounded overflow-hidden border-2 transition-colors ${
                              selectedPresetKey === img.storageKey
                                ? 'border-primary'
                                : 'border-transparent'
                            }`}
                          >
                            <Image
                              src={getPublicUrl(img.storageKey)}
                              alt={img.altText || img.originalName}
                              fill
                              sizes="(max-width: 768px) 50vw, 300px"
                              className="object-cover"
                            />
                            {selectedPresetKey === img.storageKey && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* B: 背景色 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="color" id="nc-color" />
                  <Label htmlFor="nc-color">背景色</Label>
                </div>
                {namecardType === 'color' && (
                  <div className="pl-6 space-y-2">
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_BG_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedBgColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-colors ${
                            selectedBgColor === color
                              ? 'border-primary scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={color}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="custom-bg-color" className="text-sm">
                        カスタム色:
                      </Label>
                      <input
                        id="custom-bg-color"
                        type="color"
                        value={selectedBgColor}
                        onChange={(e) => setSelectedBgColor(e.target.value)}
                        className="w-10 h-8 rounded cursor-pointer border border-input"
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedBgColor}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* C: カスタム画像 */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="image" id="nc-image" />
                  <Label htmlFor="nc-image">カスタム画像</Label>
                </div>
                {namecardType === 'image' && (
                  <div className="pl-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      推奨: 800×200px (4:1)
                    </p>
                    {/* 設定済み画像のプレビュー + 削除ボタン */}
                    {savedNamecard?.type === 'image' && savedNamecard.imageKey && namecardUploadedFiles.length === 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">現在の画像</p>
                        <div className="relative w-full aspect-[4/1] rounded overflow-hidden bg-muted">
                          <Image
                            src={getPublicUrl(savedNamecard.imageKey)}
                            alt="現在のネームカード画像"
                            fill
                            sizes="(max-width: 768px) 100vw, 640px"
                            className="object-cover"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          onClick={handleNamecardImageDelete}
                          disabled={isNamecardImageDeleting}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {isNamecardImageDeleting ? '削除中...' : '画像を削除'}
                        </Button>
                      </div>
                    )}
                    <ImageUploader
                      mode="immediate"
                      maxFiles={1}
                      maxSize={5 * 1024 * 1024}
                      folder="namecard-images"
                      previewSize="large"
                      rounded={false}
                      value={namecardUploadedFiles}
                      onUpload={setNamecardUploadedFiles}
                    />
                  </div>
                )}
              </div>

              {/* D: デフォルトに戻す */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="nc-none" />
                <Label htmlFor="nc-none" className="flex items-center gap-1">
                  <RotateCcw className="w-3.5 h-3.5" />
                  デフォルト（テーマに従う）
                </Label>
              </div>
            </RadioGroup>

            {/* 文字色設定（デフォルト以外で表示） */}
            {namecardType !== 'none' && (
              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">文字色</Label>
                  {selectedTextColor && (
                    <button
                      type="button"
                      onClick={() => setSelectedTextColor('')}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      テーマデフォルト
                    </button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedTextColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-colors ${
                        selectedTextColor === color
                          ? 'border-primary scale-110'
                          : 'border-muted-foreground/30'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="custom-text-color" className="text-sm">
                    カスタム色:
                  </Label>
                  <input
                    id="custom-text-color"
                    type="color"
                    value={selectedTextColor || '#000000'}
                    onChange={(e) => setSelectedTextColor(e.target.value)}
                    className="w-10 h-8 rounded cursor-pointer border border-input"
                  />
                  <span className="text-sm text-muted-foreground">
                    {selectedTextColor || 'テーマデフォルト'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isNamecardSaving}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleNamecardSave}
                disabled={isNamecardSaving}
                className="flex-1"
              >
                {isNamecardSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </EditModal>
  )
}
