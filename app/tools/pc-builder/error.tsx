'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PcBuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h2 className="text-xl font-semibold">エラーが発生しました</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <div className="flex gap-2">
        <Button onClick={reset}>もう一度試す</Button>
        <Button variant="outline" asChild>
          <Link href="/tools/pc-builder">PC構成シミュレーターへ</Link>
        </Button>
      </div>
    </div>
  )
}
