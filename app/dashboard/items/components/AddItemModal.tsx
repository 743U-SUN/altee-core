'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UserItemWithDetails } from "@/types/item"
import { ExistingItemSelector } from './ExistingItemSelector'

interface AddItemModalProps {
  isOpen?: boolean
  onClose?: () => void
  onItemAdded: (userItem: UserItemWithDetails) => void
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
}

export function AddItemModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onItemAdded,
  userId,
  categories,
  brands
}: AddItemModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen

  const handleItemAdded = useCallback((userItem: UserItemWithDetails) => {
    onItemAdded(userItem)
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setInternalOpen(false)
    }
  }, [onItemAdded, controlledOnClose])

  const handleClose = useCallback(() => {
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setInternalOpen(false)
    }
  }, [controlledOnClose])

  const handleOpenChange = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalOpen(open)
    }
    if (!open && controlledOnClose) {
      controlledOnClose()
    }
  }

  const trigger = controlledIsOpen === undefined ? (
    <DialogTrigger asChild>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        アイテムを追加
      </Button>
    </DialogTrigger>
  ) : null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>アイテムを追加</DialogTitle>
          <DialogDescription>
            既存のアイテムから選択してください。
          </DialogDescription>
        </DialogHeader>

        <ExistingItemSelector
          userId={userId}
          categories={categories}
          brands={brands}
          onItemAdded={handleItemAdded}
        />

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
