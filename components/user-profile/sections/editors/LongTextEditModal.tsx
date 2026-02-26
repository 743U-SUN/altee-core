'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import type { LongTextData } from '@/types/profile-sections'

interface LongTextEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: LongTextData
  currentTitle?: string
}

/**
 * 長文編集モーダル
 * マークダウン対応のテキストエディタ
 */
export function LongTextEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
  currentTitle,
}: LongTextEditModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState(currentTitle ?? '')
  const [content, setContent] = useState(currentData.content || '')
  const [isPending, startTransition] = useTransition()

  // 保存処理
  const handleSave = () => {
    startTransition(async () => {
      try {
        const longTextData: LongTextData = {
          content,
        }

        const result = await updateSection(sectionId, {
          title: title.trim() || null,
          data: longTextData,
        })

        if (result.success) {
          toast.success('長文テキストを更新しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '長文テキストの更新に失敗しました')
        }
      } catch (error) {
        console.error('長文テキスト更新エラー:', error)
        toast.error('長文テキストの更新中にエラーが発生しました')
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="長文テキストを編集"
      isSaving={isPending}
    >
      <div className="space-y-4">
        {/* セクションタイトル */}
        <div className="space-y-1">
          <Label htmlFor="section-title">セクションタイトル（任意）</Label>
          <Input
            id="section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: プロフィール"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">{title.length}/50文字</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="content">内容（Markdown形式）</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Markdown形式でテキストを入力してください"
            rows={15}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {content.length}文字 | Markdown記法が使用できます（見出し、リスト、リンクなど）
          </p>
        </div>

        {/* Markdownヒント */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
          <p className="font-semibold">Markdown記法の例:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li># 見出し1 / ## 見出し2 / ### 見出し3</li>
            <li>**太字** / *斜体*</li>
            <li>- リスト項目</li>
            <li>[リンクテキスト](URL)</li>
          </ul>
        </div>
      </div>
    </EditModal>
  )
}
