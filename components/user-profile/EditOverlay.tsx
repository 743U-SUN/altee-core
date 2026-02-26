'use client'

import type { ReactNode } from 'react'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditOverlayProps {
  isEditable: boolean
  onClick: () => void
  children: ReactNode
  label?: string
  className?: string
}

/**
 * 編集オーバーレイコンポーネント
 * ホバー時に半透明オーバーレイ + 編集アイコンを表示
 */
export function EditOverlay({
  isEditable,
  onClick,
  children,
  label = '編集',
  className,
}: EditOverlayProps) {
  if (!isEditable) {
    return <>{children}</>
  }

  return (
    <div className={cn('group relative', className)}>
      {children}

      {/* ホバー時のオーバーレイ */}
      <div
        className="
          absolute inset-0
          bg-black/0 group-hover:bg-black/30
          transition-all duration-200
          cursor-pointer
          rounded-md
          flex items-center justify-center
          opacity-0 group-hover:opacity-100
        "
        onClick={onClick}
      >
        <div
          className="
            flex items-center gap-2
            px-4 py-2
            bg-white dark:bg-gray-800
            rounded-md
            shadow-lg
            border border-gray-200 dark:border-gray-700
          "
        >
          <Pencil className="w-4 h-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      </div>
    </div>
  )
}
