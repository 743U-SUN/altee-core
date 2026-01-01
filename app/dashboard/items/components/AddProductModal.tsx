'use client'

import { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { UserItemWithDetails } from "@/types/item"
import { ExistingProductSelector } from './ExistingProductSelector'

interface AddProductModalProps {
  isOpen?: boolean
  onClose?: () => void
  onProductAdded: (userItem: UserItemWithDetails) => void
  userId: string
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
}

export function AddProductModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onProductAdded,
  userId,
  categories,
  brands
}: AddProductModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen

  const handleProductAdded = useCallback((userItem: UserItemWithDetails) => {
    onProductAdded(userItem)
    if (controlledOnClose) {
      controlledOnClose()
    } else {
      setInternalOpen(false)
    }
  }, [onProductAdded, controlledOnClose])

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

        <ExistingProductSelector
          userId={userId}
          categories={categories}
          brands={brands}
          onProductAdded={handleProductAdded}
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
