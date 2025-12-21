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
  userCount?: number
}

export function DeleteDeviceButton({ deviceId, deviceName, userCount = 0 }: DeleteDeviceButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showForceConfirm, setShowForceConfirm] = useState(false)

  const handleDelete = async (force: boolean = false) => {
    setIsDeleting(true)

    try {
      const result = await deleteDevice(deviceId, force)

      // 使用中で強制削除が必要な場合
      if (!result.success && result.requiresForce) {
        setShowForceConfirm(true)
        setIsDeleting(false)
        return
      }

      if (result.success) {
        toast.success(result.message || 'デバイスを削除しました')
        // ページリロードで一覧を更新
        window.location.reload()
      } else {
        toast.error(result.error || 'デバイスの削除に失敗しました')
      }
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('デバイスの削除中にエラーが発生しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {/* 通常削除ダイアログ */}
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
              「{deviceName}」を削除します。
              {userCount > 0 && (
                <>
                  <br /><br />
                  <span className="text-destructive font-medium">
                    ⚠️ このデバイスは{userCount}人のユーザーが使用中です
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(false)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '削除中...' : '削除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 強制削除確認ダイアログ */}
      <AlertDialog open={showForceConfirm} onOpenChange={setShowForceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ 使用中のデバイスを削除</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  このデバイスは<strong className="text-foreground">{userCount}人のユーザー</strong>が使用中です。
                </p>
                <p>
                  削除すると、これらのユーザーの所有情報もすべて削除されます。
                </p>
                <p className="text-destructive font-medium">
                  この操作は取り消せません。
                </p>
                <p className="mt-4">
                  本当に削除しますか？
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowForceConfirm(false)}>
              キャンセル
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowForceConfirm(false)
                handleDelete(true)
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '削除中...' : `削除する (${userCount}人の所有情報を含む)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}