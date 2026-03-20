'use client'

import { Button } from '@/components/ui/button'

interface AdminErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
}

export function AdminErrorFallback({ error, reset }: AdminErrorFallbackProps) {
  return (
    <div className="container mx-auto p-6 text-center space-y-4">
      <h2 className="text-xl font-bold">エラーが発生しました</h2>
      <p className="text-muted-foreground">
        予期しないエラーが発生しました。再試行するか、しばらくお待ちください。
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">
          エラーID: {error.digest}
        </p>
      )}
      <Button onClick={reset}>再試行</Button>
    </div>
  )
}
