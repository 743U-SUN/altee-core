'use client'

import { useState } from 'react'
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteUserItem } from "@/app/actions/item-actions"

interface DeleteUserItemButtonProps {
  userItemId: string
  userId: string
  itemName: string
  onDelete: () => void
}

export function DeleteUserItemButton({
  userItemId,
  userId,
  itemName,
  onDelete
}: DeleteUserItemButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteUserItem(userId, userItemId)

      if (result.success) {
        toast.success('アイテムを削除しました')
        onDelete()
        setIsOpen(false)
      } else {
        toast.error(result.error || 'アイテムの削除に失敗しました')
      }
    } catch {
      toast.error('削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <DropdownMenuItem
        className="text-destructive focus:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        削除
      </DropdownMenuItem>

      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>アイテムを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                <span className="font-medium">「{itemName}」</span>
                をマイアイテムから削除します。
              </span>
              <span className="block text-sm">
                この操作は取り消せません。アイテム自体は削除されず、あなたの登録のみが削除されます。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
