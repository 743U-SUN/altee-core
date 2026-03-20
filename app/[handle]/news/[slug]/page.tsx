import { cache } from 'react'
import { notFound } from 'next/navigation'
import { getPublicNewsArticle } from '@/lib/queries/news-queries'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { NewsArticleContent } from '../components/NewsArticleContent'

interface NewsArticlePageProps {
  params: Promise<{ handle: string; slug: string }>
}

const getCachedArticle = cache(
  async (handle: string, slug: string) => {
    return getPublicNewsArticle(handle, slug)
  }
)

export async function generateMetadata({ params }: NewsArticlePageProps) {
  const { handle, slug } = await params
  const article = await getCachedArticle(handle, slug)

  if (!article) {
    return { title: 'Not Found' }
  }

  const thumbnailUrl = article.thumbnail?.storageKey
    ? getPublicUrl(article.thumbnail.storageKey)
    : undefined

  return {
    title: `${article.title} | @${handle}`,
    description: article.content.slice(0, 160),
    openGraph: {
      title: article.title,
      description: article.content.slice(0, 160),
      ...(thumbnailUrl && {
        images: [{ url: thumbnailUrl, width: 1200, height: 630 }],
      }),
    },
  }
}

export default async function NewsArticlePage({
  params,
}: NewsArticlePageProps) {
  const { handle, slug } = await params
  const article = await getCachedArticle(handle, slug)

  if (!article) notFound()

  const thumbnailUrl = article.thumbnail?.storageKey
    ? getPublicUrl(article.thumbnail.storageKey)
    : null

  const bodyImageUrl = article.bodyImage?.storageKey
    ? getPublicUrl(article.bodyImage.storageKey)
    : null

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <NewsArticleContent
        title={article.title}
        content={article.content}
        thumbnailUrl={thumbnailUrl}
        bodyImageUrl={bodyImageUrl}
        createdAt={article.createdAt}
      />
    </div>
  )
}
