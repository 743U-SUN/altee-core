import { notFound } from 'next/navigation'
import { getUserByHandle } from '@/lib/handle-utils'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { SectionRenderer } from '@/components/profile/SectionRenderer'
import type { Metadata } from 'next'
import type { UserSection } from '@/types/profile-sections'

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const user = await getUserByHandle(handle)

  const displayName =
    user?.characterInfo?.characterName ?? user?.name ?? handle

  return {
    title: 'プロフィール',
    description: `${displayName}のプロフィールページ`,
    openGraph: {
      title: `${displayName}のプロフィール`,
      description: `${displayName}のプロフィールページ`,
    },
  }
}

export default async function HandlePage({
  params,
}: Props) {
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
