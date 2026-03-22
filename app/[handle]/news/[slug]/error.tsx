'use client'

import { Button } from '@/components/ui/button'

export default function NewsArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">記事の読み込みに失敗しました</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button onClick={reset} variant="outline">
        もう一度試す
      </Button>
    </div>
  )
}
