'use client'

import { useState, useTransition } from 'react'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import Image from 'next/image'
import type { CharacterProfileData } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'
import { Trash2 } from 'lucide-react'

interface CharacterProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: CharacterProfileData
}

/**
 * キャラクタープロフィール編集モーダル
 * キャラクター画像、背景画像、名前、タグライン、bio、バッジ、配置を編集
 */
export function CharacterProfileEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: CharacterProfileEditModalProps) {
  const [isPending, startTransition] = useTransition()
  const [editName, setEditName] = useState(currentData.name || '')
  const [editTagline, setEditTagline] = useState(currentData.tagline || '')
  const [editBio, setEditBio] = useState(currentData.bio || '')
  const [editBadgeLeft, setEditBadgeLeft] = useState(currentData.badgeLeft || '')
  const [editBadgeRight, setEditBadgeRight] = useState(currentData.badgeRight || '')
  const [editPosition, setEditPosition] = useState<'left' | 'right'>(currentData.characterPosition || 'left')
  const [editShowSocialLinks, setEditShowSocialLinks] = useState(currentData.showSocialLinks || false)
  const [editSocialLinks, setEditSocialLinks] = useState(currentData.socialLinks || [])

  const [uploadedCharacterImages, setUploadedCharacterImages] = useState<UploadedFile[]>([])
  const [uploadedBackgroundImages, setUploadedBackgroundImages] = useState<UploadedFile[]>([])

  const handleSave = () => {
    if (!editName.trim()) {
      toast.error('キャラクター名を入力してください')
      return
    }

    startTransition(async () => {
      const newData: CharacterProfileData = {
        name: editName,
        tagline: editTagline,
        bio: editBio,
        badgeLeft: editBadgeLeft,
        badgeRight: editBadgeRight,
        characterPosition: editPosition,
        showSocialLinks: editShowSocialLinks,
        socialLinks: editSocialLinks,
        characterImageKey: uploadedCharacterImages.length > 0
          ? uploadedCharacterImages[0].key
          : currentData.characterImageKey,
        characterBackgroundKey: uploadedBackgroundImages.length > 0
          ? uploadedBackgroundImages[0].key
          : currentData.characterBackgroundKey,
      }

      const result = await updateSection(sectionId, { data: newData })

      if (result.success) {
        toast.success('キャラクタープロフィールを更新しました')
        onClose()
      } else {
        toast.error(result.error || '更新に失敗しました')
      }
    })
  }

  const handleDeleteCharacterImage = () => {
    startTransition(async () => {
      const newData: CharacterProfileData = {
        ...currentData,
        characterImageKey: undefined,
      }

      const result = await updateSection(sectionId, { data: newData })

      if (result.success) {
        toast.success('キャラクター画像を削除しました')
        onClose()
      } else {
        toast.error(result.error || '削除に失敗しました')
      }
    })
  }

  const handleDeleteBackgroundImage = () => {
    startTransition(async () => {
      const newData: CharacterProfileData = {
        ...currentData,
        characterBackgroundKey: undefined,
      }

      const result = await updateSection(sectionId, { data: newData })

      if (result.success) {
        toast.success('背景画像を削除しました')
        onClose()
      } else {
        toast.error(result.error || '削除に失敗しました')
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="キャラクタープロフィールを編集"
      hideActions
    >
      <div className="space-y-6">
        {/* バッジ設定 */}
        <div className="space-y-4">
          <Label className="text-base font-medium">バッジ</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="badgeLeft" className="text-sm text-muted-foreground">
                左
              </Label>
              <Input
                id="badgeLeft"
                value={editBadgeLeft}
                onChange={(e) => setEditBadgeLeft(e.target.value)}
                placeholder="RANK S"
                maxLength={20}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badgeRight" className="text-sm text-muted-foreground">
                右
              </Label>
              <Input
                id="badgeRight"
                value={editBadgeRight}
                onChange={(e) => setEditBadgeRight(e.target.value)}
                placeholder="Warrior"
                maxLength={20}
              />
            </div>
          </div>
        </div>

        {/* キャラクター名 */}
        <div className="space-y-2">
          <Label htmlFor="name">キャラクター名 <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="キャラクター名を入力"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            {editName.length}/50文字
          </p>
        </div>

        {/* キャッチコピー */}
        <div className="space-y-2">
          <Label htmlFor="tagline">キャッチコピー</Label>
          <Input
            id="tagline"
            value={editTagline}
            onChange={(e) => setEditTagline(e.target.value)}
            placeholder="例: 闇を纏う戦士"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {editTagline.length}/100文字
          </p>
        </div>

        {/* 自己紹介文 */}
        <div className="space-y-2">
          <Label htmlFor="bio">自己紹介文</Label>
          <Textarea
            id="bio"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            placeholder="キャラクターの詳細な説明を入力"
            maxLength={500}
            rows={5}
          />
          <p className="text-xs text-muted-foreground">
            {editBio.length}/500文字
          </p>
        </div>

        {/* キャラクター画像位置 */}
        <div className="space-y-3">
          <Label className="text-base font-medium">キャラクター画像の位置</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="left"
                checked={editPosition === 'left'}
                onChange={(e) => setEditPosition(e.target.value as 'left' | 'right')}
                className="w-4 h-4"
              />
              <span>左側</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="right"
                checked={editPosition === 'right'}
                onChange={(e) => setEditPosition(e.target.value as 'left' | 'right')}
                className="w-4 h-4"
              />
              <span>右側</span>
            </label>
          </div>
        </div>

        {/* SNSリンク表示 */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={editShowSocialLinks}
              onChange={(e) => setEditShowSocialLinks(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">SNSリンクを表示する</span>
          </label>
          <p className="text-xs text-muted-foreground">
            プロフィール内にSNSリンクを表示します
          </p>
        </div>

        {/* キャラクター画像 */}
        <div className="space-y-2 pt-4 border-t">
          <Label>キャラクター画像</Label>
          <p className="text-xs text-muted-foreground">
            推奨: 9:16の縦長画像 (例: 720×1280px) ・ キャラクター全身像に最適
          </p>

          {currentData.characterImageKey && uploadedCharacterImages.length === 0 && (
            <div className="space-y-2">
              <div className="relative w-32 aspect-[9/16] rounded-lg overflow-hidden border">
                <Image
                  src={`/api/files/${currentData.characterImageKey}`}
                  alt="現在のキャラクター画像"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteCharacterImage}
                disabled={isPending}
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
            folder="character-images"
            previewSize="medium"
            value={uploadedCharacterImages}
            onUpload={setUploadedCharacterImages}
          />
        </div>

        {/* 背景画像 */}
        <div className="space-y-2 pt-4 border-t">
          <Label>背景画像（オプション）</Label>
          <p className="text-xs text-muted-foreground">
            ぼかし効果で背景に表示されます
          </p>

          {currentData.characterBackgroundKey && uploadedBackgroundImages.length === 0 && (
            <div className="space-y-2">
              <div className="relative w-48 h-32 rounded-lg overflow-hidden border">
                <Image
                  src={`/api/files/${currentData.characterBackgroundKey}`}
                  alt="現在の背景画像"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteBackgroundImage}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                背景画像を削除
              </Button>
            </div>
          )}

          <ImageUploader
            mode="immediate"
            maxFiles={1}
            maxSize={10 * 1024 * 1024}
            folder="character-backgrounds"
            previewSize="medium"
            value={uploadedBackgroundImages}
            onUpload={setUploadedBackgroundImages}
          />
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
