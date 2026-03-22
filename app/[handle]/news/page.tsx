import {
  getPublicNewsByHandle,
  getPublicNewsSection,
} from '@/lib/queries/news-queries'
import { getActivePresets } from '@/lib/sections/preset-queries'
import { NewsListContent } from './components/NewsListContent'

interface NewsPageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: NewsPageProps) {
  const { handle } = await params

  return {
    title: `@${handle} のNEWS`,
    description: `@${handle} のニュース・お知らせ一覧です。`,
    openGraph: {
      title: `@${handle} のNEWS`,
      description: `@${handle} のニュース・お知らせ一覧です。`,
    },
  }
}

export default async function NewsPage({ params }: NewsPageProps) {
  const { handle } = await params

  const [news, newsSection, presets] = await Promise.all([
    getPublicNewsByHandle(handle),
    getPublicNewsSection(handle),
    getActivePresets(),
  ])

  return (
    <NewsListContent
      handle={handle}
      news={news}
      newsSection={newsSection}
      presets={presets}
    />
  )
}
