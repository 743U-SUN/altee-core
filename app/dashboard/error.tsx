'use client'

import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-muted-foreground">
        ダッシュボードの読み込み中にエラーが発生しました。
      </p>
      <Button onClick={reset} variant="outline">
        もう一度試す
      </Button>
    </div>
  )
}
