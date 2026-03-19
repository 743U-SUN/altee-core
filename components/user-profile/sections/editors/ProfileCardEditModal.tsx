'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { PRESET_AVATAR } from '@/lib/image-uploader/image-processing-presets'
import { updateSection } from '@/app/actions/user/section-actions'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { toast } from 'sonner'
import Image from 'next/image'
import type { ProfileCardData } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'
import { Trash2 } from 'lucide-react'

interface ProfileCardEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: ProfileCardData
}

/**
 * プロフィールカード編集モーダル
 * 名前、バッジ、自己紹介、アバター画像を編集
 */
export function ProfileCardEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: ProfileCardEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editCharacterName, setEditCharacterName] = useState(currentData.characterName || '')
  const [editBio, setEditBio] = useState(currentData.bio || '')
  const [editBadgeLeft, setEditBadgeLeft] = useState(currentData.badgeLeft || '')
  const [editBadgeRight, setEditBadgeRight] = useState(currentData.badgeRight || '')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleSave = () => {
    startTransition(async () => {
      try {
        const newData: ProfileCardData = {
          characterName: editCharacterName,
          bio: editBio,
          badgeLeft: editBadgeLeft,
          badgeRight: editBadgeRight,
          avatarImageKey: uploadedFiles.length > 0
            ? uploadedFiles[0].key
            : currentData.avatarImageKey,
        }

        const result = await updateSection(sectionId, { data: newData })

        if (result.success) {
          toast.success('プロフィールを更新しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || 'プロフィールの更新に失敗しました')
        }
      } catch {
        toast.error('プロフィールの更新中にエラーが発生しました')
      }
    })
  }

  const handleDeleteImage = () => {
    startTransition(async () => {
      try {
        const newData: ProfileCardData = {
          ...currentData,
          avatarImageKey: undefined,
        }

        const result = await updateSection(sectionId, { data: newData })

        if (result.success) {
          toast.success('画像を削除しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '削除に失敗しました')
        }
      } catch {
        toast.error('削除中にエラーが発生しました')
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title="プロフィールを編集"
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
                placeholder="Assasin"
                maxLength={20}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {editBadgeLeft || editBadgeRight
              ? `プレビュー: ${editBadgeLeft}${editBadgeLeft && editBadgeRight ? ' — ' : ''}${editBadgeRight}`
              : '両方空欄の場合、バッジは表示されません'}
          </p>
        </div>

        {/* キャラクター名 */}
        <div className="space-y-2">
          <Label htmlFor="characterName">キャラクター名</Label>
          <Input
            id="characterName"
            value={editCharacterName}
            onChange={(e) => setEditCharacterName(e.target.value)}
            placeholder="キャラクター名を入力"
            maxLength={30}
          />
          <p className="text-xs text-muted-foreground">
            {editCharacterName.length}/30文字
          </p>
        </div>

        {/* タグライン */}
        <div className="space-y-2">
          <Label htmlFor="bio">タグライン / キャッチコピー</Label>
          <Textarea
            id="bio"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            placeholder="例: Characters / PLAYABLE / DARK"
            maxLength={100}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            {editBio.length}/100文字 ・ 短いキャッチコピーを入力してください
          </p>
        </div>

        {/* アバター画像 */}
        <div className="space-y-2 pt-4 border-t">
          <Label>プロフィール画像</Label>
          <p className="text-xs text-muted-foreground">
            推奨: 200×200px (1:1) ・ 右上に表示されます
          </p>

          {currentData.avatarImageKey && uploadedFiles.length === 0 && (
            <div className="space-y-2">
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                <Image
                  src={getPublicUrl(currentData.avatarImageKey)}
                  alt="現在のプロフィール画像"
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteImage}
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
            maxSize={5 * 1024 * 1024}
            folder="profile-avatars"
            previewSize="medium"
            rounded
            value={uploadedFiles}
            onUpload={setUploadedFiles}
            imageProcessingOptions={PRESET_AVATAR}
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
