import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
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
  const [session, { id }] = await Promise.all([
    cachedAuth(),
    params,
  ])

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const preset = await prisma.sectionBackgroundPreset.findUnique({
    where: { id },
  })

  if (!preset) {
    notFound()
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
