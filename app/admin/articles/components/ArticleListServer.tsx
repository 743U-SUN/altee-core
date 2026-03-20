import { getArticles } from '@/app/actions/content/article-actions'
import { ArticleList } from './ArticleList'

interface ArticleListServerProps {
  currentPage: number
}

export async function ArticleListServer({ currentPage }: ArticleListServerProps) {
  const { articles, pagination } = await getArticles(currentPage, 10)
  const serializedArticles = articles.map((article) => ({
    ...article,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    publishedAt: article.publishedAt?.toISOString() ?? null,
  }))
  return <ArticleList articles={serializedArticles} pagination={pagination} />
}
