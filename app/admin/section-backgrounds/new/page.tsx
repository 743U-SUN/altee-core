import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { PresetForm } from '../components/PresetForm'

export const metadata: Metadata = {
  title: '背景プリセット追加 | Admin',
  robots: { index: false, follow: false },
}

export default async function NewPresetPage() {
  await requireAdmin()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">背景プリセット追加</h1>
        <p className="text-muted-foreground">
          新しい背景プリセットを作成します
        </p>
      </div>

      <PresetForm />
    </div>
  )
}
