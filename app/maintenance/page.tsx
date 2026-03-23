import type { Metadata } from 'next'
import { Wrench } from 'lucide-react'

export const metadata: Metadata = {
  title: 'メンテナンス中 | Altee',
}

export default function MaintenancePage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <div className="text-center">
        <Wrench className="mx-auto mb-6 size-16 text-muted-foreground" />
        <h1 className="mb-3 text-2xl font-bold tracking-tight">
          メンテナンス中
        </h1>
        <p className="text-muted-foreground">
          現在サイトのメンテナンスを行っています。
          <br />
          しばらくお待ちください。
        </p>
      </div>
    </div>
  )
}
