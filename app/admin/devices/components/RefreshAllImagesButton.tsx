'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { refreshAllDeviceImages } from '@/app/actions/device-actions'

export function RefreshAllImagesButton() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefreshAll = async () => {
    if (!confirm('全デバイスの画像をAmazonから再取得しますか？\n\n処理に時間がかかる場合があります。')) {
      return
    }

    setIsRefreshing(true)

    try {
      const result = await refreshAllDeviceImages()

      if (result.success) {
        toast.success(result.message || '画像を更新しました')
        window.location.reload()
      } else {
        toast.error('一括更新に失敗しました')
      }
    } catch (error) {
      console.error('Refresh all error:', error)
      toast.error('画像更新中にエラーが発生しました')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefreshAll}
      disabled={isRefreshing}
    >
      <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? '更新中...' : '全画像を更新'}
    </Button>
  )
}
