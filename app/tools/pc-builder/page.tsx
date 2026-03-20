import type { Metadata } from 'next'
import { PcBuilderClient } from './PcBuilderClient'

export const metadata: Metadata = {
  title: '自作PC構成シミュレーター | Altee',
  description: 'PCパーツを選んで構成をシミュレーション。互換性チェック付きで安心。',
}

export default function PcBuilderPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">自作PC構成シミュレーター</h1>
        <p className="mt-2 text-muted-foreground">
          パーツを選択して、互換性をチェックしながらPCを構成できます。
          データはブラウザに保存されるため、ログイン不要です。
        </p>
      </div>
      <PcBuilderClient />
    </div>
  )
}
