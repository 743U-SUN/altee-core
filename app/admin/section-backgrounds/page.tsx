import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { getPresetsAction } from '@/app/actions/admin/section-background-actions'
import { PresetListClient } from './components/PresetListClient'

export const metadata: Metadata = {
  title: '背景プリセット管理 | Admin',
  robots: { index: false, follow: false },
}

export default async function AdminSectionBackgroundsPage() {
  const session = await cachedAuth()

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const result = await getPresetsAction()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">背景プリセット管理</h1>
          <p className="text-muted-foreground">
            セクションバンドの背景プリセットを管理します
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/section-backgrounds/new">
            <Plus className="w-4 h-4 mr-2" />
            プリセット追加
          </Link>
        </Button>
      </div>

      {result.success && result.data ? (
        <PresetListClient presets={result.data} />
      ) : (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm text-destructive">
            {result.error || 'プリセットの取得に失敗しました'}
          </p>
        </div>
      )}
    </div>
  )
}
