'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { deleteDevice } from '@/app/actions/device-actions'

interface DeleteDeviceButtonProps {
  deviceId: string
  deviceName: string
  hasUsers?: boolean
}

export function DeleteDeviceButton({ deviceId, deviceName, hasUsers = false }: DeleteDeviceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteDevice(deviceId)
      
      if (result.success) {
        toast.success('デバイスを削除しました')
      } else {
        toast.error(result.error || 'デバイスの削除に失敗しました')
      }
    } catch {
      toast.error('デバイスの削除中にエラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  if (hasUsers) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled 
        className="text-muted-foreground"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>デバイスを削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{deviceName}」を削除します。この操作は取り消せません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? '削除中...' : '削除'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}