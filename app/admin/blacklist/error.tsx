'use client'

import { Button } from '@/components/ui/button'

export default function BlacklistError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto p-6 text-center space-y-4">
      <h2 className="text-xl font-bold">エラーが発生しました</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>再試行</Button>
    </div>
  )
}
