import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PresetForm } from '../components/PresetForm'

export const metadata: Metadata = {
  title: '背景プリセット編集 | Admin',
  robots: { index: false, follow: false },
}

export default async function EditPresetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [, { id }] = await Promise.all([
    requireAdmin(),
    params,
  ])

  const presetRaw = await prisma.sectionBackgroundPreset.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      config: true,
      isActive: true,
      sortOrder: true,
    },
  })

  if (!presetRaw) {
    notFound()
  }

  // Date フィールドを除いた必要フィールドのみをクライアントコンポーネントへ渡す
  const preset = {
    ...presetRaw,
    config: presetRaw.config as Record<string, unknown>,
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">背景プリセット編集</h1>
        <p className="text-muted-foreground">
          「{preset.name}」を編集します
        </p>
      </div>

      <PresetForm preset={preset} />
    </div>
  )
}
