import { notFound } from 'next/navigation'
import { SectionRenderer } from '@/components/profile/SectionRenderer'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { getVideoPageData } from '@/lib/queries/video-queries'
import Link from 'next/link'
import type { UserSection } from '@/types/profile-sections'

interface VideosPageProps {
  params: Promise<{
    handle: string
  }>
}

export async function generateMetadata({ params }: VideosPageProps) {
  const { handle } = await params
  const user = await getVideoPageData(handle)

  if (!user) {
    return { title: '動画 - ユーザーが見つかりません' }
  }

  const characterName = user.characterInfo?.characterName ?? `@${handle}`

  return {
    title: `${characterName} の動画`,
    description: `${characterName} の動画ページです。`,
    openGraph: {
      title: `${characterName} の動画`,
      description: `${characterName} の動画ページです。`,
    },
  }
}

export default async function VideosPage({ params }: VideosPageProps) {
  const { handle } = await params

  const [user, presets] = await Promise.all([
    getVideoPageData(handle),
    getActivePresets(),
  ])

  if (!user) {
    notFound()
  }

  const sections = user.userSections as UserSection[]

  if (sections.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">動画</h1>
            <Link
              href={`/@${handle}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              プロフィールに戻る
            </Link>
          </div>

          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>まだ動画が設定されていません</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <SectionRenderer sections={sections} presets={presets} />
    </div>
  )
}
