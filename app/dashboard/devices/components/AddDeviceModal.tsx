'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { getDeviceCategories, getBrands } from "@/app/actions/device-actions"
import { UserDeviceWithDetails } from "@/types/device"
import { ExistingDeviceSelector } from './ExistingDeviceSelector'
import { NewDeviceCreator } from './NewDeviceCreator'

interface AddDeviceModalProps {
  isOpen?: boolean
  onClose?: () => void
  onDeviceAdded: (userDevice: UserDeviceWithDetails) => void
  userId: string
}

type Tab = 'existing' | 'new'

export function AddDeviceModal({ isOpen: controlledIsOpen, onClose: controlledOnClose, onDeviceAdded, userId }: AddDeviceModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('existing')
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
  const [brands, setBrands] = useState<{ id: string, name: string }[]>([])

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen
  const onClose = controlledOnClose || (() => setInternalOpen(false))

  // モーダルが開かれたときにカテゴリとブランドを取得
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      getDeviceCategories().then(setCategories)
      getBrands().then(setBrands)
    }
  }, [isOpen, categories.length])

  const handleDeviceAdded = (userDevice: UserDeviceWithDetails) => {
    onDeviceAdded(userDevice)
    onClose()
  }

  const handleClose = () => {
    setActiveTab('existing')
    onClose()
  }

  const handleOpenChange = (open: boolean) => {
    if (controlledIsOpen === undefined) {
      setInternalOpen(open)
    }
    if (!open && controlledOnClose) {
      controlledOnClose()
    }
    if (!open) {
      setActiveTab('existing')
    }
  }

  const trigger = controlledIsOpen === undefined ? (
    <DialogTrigger asChild>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        デバイスを追加
      </Button>
    </DialogTrigger>
  ) : null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>デバイスを追加</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">既存デバイスから選択</TabsTrigger>
            <TabsTrigger value="new">新しいデバイスを作成</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <ExistingDeviceSelector
              userId={userId}
              categories={categories}
              brands={brands}
              onDeviceAdded={handleDeviceAdded}
            />
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <NewDeviceCreator
              userId={userId}
              categories={categories}
              brands={brands}
              onDeviceAdded={handleDeviceAdded}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}