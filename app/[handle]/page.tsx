import { notFound } from 'next/navigation'
import { getUserByHandle } from '@/lib/handle-utils'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { SectionRenderer } from '@/components/profile/SectionRenderer'
import type { UserSection } from '@/types/profile-sections'

export default async function HandlePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const [user, presets] = await Promise.all([
    getUserByHandle(handle),
    getActivePresets(),
  ])

  if (!user || !user.userSections) {
    notFound()
  }

  return (
    <SectionRenderer
      sections={user.userSections as UserSection[]}
      presets={presets}
      isEditable={false}
    />
  )
}
