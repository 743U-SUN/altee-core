import { notFound } from 'next/navigation'
import { getPublicNewsArticle } from '@/lib/queries/news-queries'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { NewsArticleContent } from '../components/NewsArticleContent'

/** OG description 用マークダウン簡易ストリップ */
function stripMarkdown(text: string): string {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, '')   // 画像 ![alt](url)
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1') // リンク [text](url) → text
    .replace(/#{1,6}\s*/g, '')          // 見出し #
    .replace(/[*_~`]+/g, '')            // 強調・コード
    .replace(/^\s*[-*+]\s+/gm, '')      // 箇条書き
    .replace(/^\s*\d+\.\s+/gm, '')      // 番号付きリスト
    .replace(/\n+/g, ' ')              // 改行をスペースに
    .trim()
}

interface NewsArticlePageProps {
  params: Promise<{ handle: string; slug: string }>
}

export async function generateMetadata({ params }: NewsArticlePageProps) {
  const { handle, slug } = await params
  const article = await getPublicNewsArticle(handle, slug)

  if (!article) {
    return { title: 'Not Found' }
  }

  const thumbnailUrl = article.thumbnail?.storageKey
    ? getPublicUrl(article.thumbnail.storageKey)
    : undefined

  return {
    title: `${article.title} | @${handle}`,
    description: stripMarkdown(article.content).slice(0, 160),
    openGraph: {
      title: article.title,
      description: stripMarkdown(article.content).slice(0, 160),
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
  const article = await getPublicNewsArticle(handle, slug)

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
