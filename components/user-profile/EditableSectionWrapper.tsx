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
 * 下部: 操作ツールバー（移動・編集・削除を水平配置、セクションに重なって表示）
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
    <div>
      {children}

      {/* 下端: 操作ツールバー（セクションに重なって配置） */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30">
        <div className="flex items-center gap-1 bg-gray-800/70 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            onClick={onMoveUp}
            disabled={isFirst}
            title="上へ移動"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            onClick={onMoveDown}
            disabled={isLast}
            title="下へ移動"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-gray-500/50 mx-1" />

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            onClick={onEdit}
            title="編集"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            onClick={onStyleEdit}
            title="スタイル設定"
          >
            <Palette className="h-4 w-4" />
          </Button>

          <div className="w-px h-5 bg-gray-500/50 mx-1" />

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-full"
            onClick={onDelete}
            title="削除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
