import type { Metadata } from 'next'
import { Suspense } from 'react'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
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

  const presets = await prisma.sectionBackgroundPreset.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  const serializedPresets = presets.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))

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

      <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded" />}>
        <PresetListClient presets={serializedPresets} />
      </Suspense>
    </div>
  )
}
