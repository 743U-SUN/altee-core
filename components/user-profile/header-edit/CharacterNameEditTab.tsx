'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserProfile } from '@/app/actions/user/profile-actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CharacterNameEditTabProps {
  onClose: () => void
  currentCharacterName?: string | null
}

export function CharacterNameEditTab({
  onClose,
  currentCharacterName,
}: CharacterNameEditTabProps) {
  const router = useRouter()
  const [characterName, setCharacterName] = useState(currentCharacterName || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!characterName.trim()) {
      toast.error('キャラクター名を入力してください')
      return
    }
    setIsSaving(true)
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
      setIsSaving(false)
    }
  }

  return (
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
          disabled={isSaving}
          className="flex-1"
        >
          キャンセル
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || !characterName.trim()}
          className="flex-1"
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  )
}
