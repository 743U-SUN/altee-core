'use client'

import { useState } from 'react'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import type { HeaderData } from '@/types/profile-sections'

interface HeaderEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: HeaderData
}

/**
 * ヘッダー編集モーダル
 * 見出しテキストとレベルを編集
 */
export function HeaderEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: HeaderEditModalProps) {
  const [text, setText] = useState(currentData.text || '')
  const [level, setLevel] = useState<'h2' | 'h3' | 'h4'>(
    currentData.level || 'h2'
  )
  const [isSaving, setIsSaving] = useState(false)

  // 保存処理
  const handleSave = async () => {
    if (!text.trim()) {
      toast.error('見出しテキストは必須です')
      return
    }

    setIsSaving(true)
    try {
      const headerData: HeaderData = {
        text,
        level,
      }

      const result = await updateSection(sectionId, { data: headerData })

      if (result.success) {
        toast.success('見出しを更新しました')
        onClose()
      } else {
        toast.error(result.error || '見出しの更新に失敗しました')
      }
    } catch (error) {
      console.error('見出し更新エラー:', error)
      toast.error('見出しの更新中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="見出しを編集"
      isSaving={isSaving}
    >
      <div className="space-y-4">
        {/* テキスト */}
        <div className="space-y-2">
          <Label htmlFor="text">見出しテキスト</Label>
          <Input
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="見出しを入力"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {text.length}/100文字
          </p>
        </div>

        {/* レベル */}
        <div className="space-y-2">
          <Label htmlFor="level">見出しレベル</Label>
          <Select value={level} onValueChange={(v) => setLevel(v as 'h2' | 'h3' | 'h4')}>
            <SelectTrigger id="level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="h2">大見出し (H2)</SelectItem>
              <SelectItem value="h3">中見出し (H3)</SelectItem>
              <SelectItem value="h4">小見出し (H4)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            見出しの大きさを選択してください
          </p>
        </div>

        {/* プレビュー */}
        <div className="space-y-2">
          <Label>プレビュー</Label>
          <div className="border rounded-lg p-4 bg-muted/30">
            {level === 'h2' && (
              <h2 className="text-3xl font-bold">{text || '見出し'}</h2>
            )}
            {level === 'h3' && (
              <h3 className="text-2xl font-semibold">{text || '見出し'}</h3>
            )}
            {level === 'h4' && (
              <h4 className="text-xl font-medium">{text || '見出し'}</h4>
            )}
          </div>
        </div>
      </div>
    </EditModal>
  )
}
