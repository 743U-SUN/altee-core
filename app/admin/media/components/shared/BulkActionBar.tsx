"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"

interface BulkActionBarProps {
  selectedCount: number
  bulkDeleting: boolean
  onBulkDelete: () => void
}

export function BulkActionBar({ selectedCount, bulkDeleting, onBulkDelete }: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
      <span className="text-sm font-medium">
        {selectedCount}件のファイルが選択されています
      </span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            disabled={bulkDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            選択したファイルを削除
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ファイルの一括削除</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCount}件のファイルを削除しようとしています。
              この操作は取り消すことができません。実行しますか？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
