'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Trash2 } from 'lucide-react'
import { deleteProductAction } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface DeleteProductButtonProps {
  productId: string
  productName: string
  hasUsers: boolean
}

export function DeleteProductButton({
  productId,
  productName,
  hasUsers,
}: DeleteProductButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProductAction(productId)

      if (result.success) {
        toast.success('商品を削除しました')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || '商品の削除に失敗しました')
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={hasUsers}
          title={
            hasUsers
              ? 'ユーザーが登録しているため削除できません'
              : undefined
          }
        >
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>商品の削除</AlertDialogTitle>
          <AlertDialogDescription>
            商品「{productName}」を削除してもよろしいですか？
            <br />
            この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            キャンセル
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? '削除中...' : '削除する'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
