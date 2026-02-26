import { getArticles } from '@/app/actions/content/article-actions'
import { ArticleList } from './ArticleList'

interface ArticleListServerProps {
  currentPage: number
}

export async function ArticleListServer({ currentPage }: ArticleListServerProps) {
  const { articles, pagination } = await getArticles(currentPage, 10)
  return <ArticleList articles={articles} pagination={pagination} />
}
