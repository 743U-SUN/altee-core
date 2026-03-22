'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ItemsError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold">エラーが発生しました</h2>
        <p className="text-sm text-muted-foreground">
          アイテムの読み込み中に問題が発生しました。
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        もう一度試す
      </Button>
    </div>
  )
}
