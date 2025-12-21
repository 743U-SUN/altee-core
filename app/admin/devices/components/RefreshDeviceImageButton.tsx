'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { refreshDeviceImage } from '@/app/actions/device-actions'

interface RefreshDeviceImageButtonProps {
  deviceId: string
  deviceName: string
}

export function RefreshDeviceImageButton({ deviceId }: RefreshDeviceImageButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsRefreshing(true)

    try {
      const result = await refreshDeviceImage(deviceId)

      if (result.success) {
        toast.success(result.message || '画像を更新しました')
        window.location.reload()
      } else {
        toast.error(result.error || '画像の更新に失敗しました')
      }
    } catch (error) {
      console.error('Refresh error:', error)
      toast.error('画像更新中にエラーが発生しました')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Amazonから画像を再取得"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  )
}
