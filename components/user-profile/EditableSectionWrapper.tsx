'use client'

import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, Pencil, Palette, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface EditableSectionWrapperProps {
  children: ReactNode
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onStyleEdit: () => void
  onDelete: () => void
}

/**
 * 編集可能なセクションのラッパー
 * 左側: 上下移動ボタン（縦配置）
 * 右側: 編集ボタン（上）+ 削除ボタン（下）
 * 常時表示、レスポンシブ対応
 */
export function EditableSectionWrapper({
  children,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onEdit,
  onStyleEdit,
  onDelete,
}: EditableSectionWrapperProps) {
  return (
    <div className="relative">
      {/* 左側: 上下移動ボタン（縦配置） */}
      <div
        className="
          absolute -left-8 top-1/2 -translate-y-1/2 z-[5]
          flex flex-col gap-3
          md:-left-8
        "
      >
        <Button
          size="icon"
          variant="simple1"
          className="h-8 w-8 bg-gray-600/90 backdrop-blur-sm shadow-md"
          onClick={onMoveUp}
          disabled={isFirst}
          title="上へ移動"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="simple1"
          className="h-8 w-8 bg-gray-600/90 backdrop-blur-sm shadow-md"
          onClick={onMoveDown}
          disabled={isLast}
          title="下へ移動"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* セクションコンテンツ */}
      {children}

      {/* 右側: 編集＋スタイル＋削除ボタン（縦配置） */}
      <div
        className="
          absolute -right-8 top-1/2 -translate-y-1/2 z-[5]
          flex flex-col gap-3
          md:-right-8
        "
      >
        <Button
          size="icon"
          variant="simple1"
          className="h-8 w-8 bg-gray-600/90 backdrop-blur-sm shadow-md"
          onClick={onEdit}
          title="編集"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="simple1"
          className="h-8 w-8 bg-gray-600/90 backdrop-blur-sm shadow-md"
          onClick={onStyleEdit}
          title="スタイル設定"
        >
          <Palette className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-8 w-8 bg-destructive/90 backdrop-blur-sm shadow-md"
          onClick={onDelete}
          title="削除"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
