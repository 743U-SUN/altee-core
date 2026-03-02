import { cache } from 'react'
import { getPublicNewsByHandle } from '@/app/actions/content/user-news-actions'
import { NewsListContent } from './components/NewsListContent'

interface NewsPageProps {
  params: Promise<{ handle: string }>
}

const getCachedNews = cache(async (handle: string) => {
  return getPublicNewsByHandle(handle)
})

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
  const news = await getCachedNews(handle)

  return (
    <div className="space-y-6 w-full">
      <NewsListContent handle={handle} news={news} />
    </div>
  )
}
