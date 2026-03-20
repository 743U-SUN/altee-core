'use client'

import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  title: string
  children: ReactNode
  saveLabel?: string
  cancelLabel?: string
  isSaving?: boolean
  hideActions?: boolean
}

/**
 * 汎用編集モーダルコンポーネント
 * セクション編集用の共通モーダル基盤
 */
export function EditModal({
  isOpen,
  onClose,
  onSave,
  title,
  children,
  saveLabel = '完了',
  cancelLabel = 'キャンセル',
  isSaving = false,
  hideActions = false,
}: EditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="py-4">{children}</div>

        {!hideActions && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              {cancelLabel}
            </Button>
            {onSave && (
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? '処理中...' : saveLabel}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
