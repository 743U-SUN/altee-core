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
import { deleteCategoryAction } from '../actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface DeleteCategoryButtonProps {
  categoryId: string
  categoryName: string
  hasProducts: boolean
  hasChildren: boolean
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  hasProducts,
  hasChildren,
}: DeleteCategoryButtonProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId)

      if (result.success) {
        toast.success('カテゴリを削除しました')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || 'カテゴリの削除に失敗しました')
      }
    })
  }

  const canDelete = !hasProducts && !hasChildren

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={!canDelete}
          title={
            !canDelete
              ? '商品または子カテゴリが存在するため削除できません'
              : undefined
          }
        >
          <Trash2 className="mr-2 h-4 w-4" />
          削除
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>カテゴリの削除</AlertDialogTitle>
          <AlertDialogDescription>
            カテゴリ「{categoryName}」を削除してもよろしいですか？
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
