import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getPresetByIdAction } from '@/app/actions/admin/section-background-actions'
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
  const session = await auth()

  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params
  const result = await getPresetByIdAction(id)

  if (!result.success || !result.data) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">背景プリセット編集</h1>
        <p className="text-muted-foreground">
          「{result.data.name}」を編集します
        </p>
      </div>

      <PresetForm preset={result.data} />
    </div>
  )
}
