/**
 * Markdown Export Utilities
 * 記事をMarkdownファイルとしてエクスポートする機能
 */

interface ArticleData {
  title: string
  slug: string
  content: string
  excerpt?: string
  createdAt: Date | string
  updatedAt: Date | string
  published: boolean
  author?: {
    name?: string | null
    email: string
  }
}

/**
 * 安全なファイル名を生成する
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

/**
 * 日付をYYYY-MM-DD形式でフォーマット
 */
function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

/**
 * Markdownファイルの内容を生成
 */
function generateMarkdownContent(article: ArticleData): string {
  return article.content
}

/**
 * ファイル名を生成
 * 形式: {slug}-{YYYY-MM-DD}.md
 */
function generateFilename(article: ArticleData): string {
  const date = formatDate(article.createdAt)
  const slug = sanitizeFilename(article.slug)
  return `${slug}-${date}.md`
}

/**
 * ブラウザでMarkdownファイルをダウンロード
 */
export function downloadMarkdownFile(article: ArticleData): void {
  try {
    const content = generateMarkdownContent(article)
    const filename = generateFilename(article)
    
    // BlobでMarkdownファイルを作成
    const blob = new Blob([content], {
      type: 'text/markdown;charset=utf-8'
    })
    
    // ダウンロード実行
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Markdown export error:', error)
    throw new Error('ファイルのエクスポートに失敗しました')
  }
}

/**
 * 記事フォームデータからエクスポート用データを作成
 */
export function createExportDataFromForm(formData: {
  title: string
  slug: string
  content: string
  excerpt?: string
  published: boolean
}): ArticleData {
  const now = new Date()
  return {
    title: formData.title,
    slug: formData.slug,
    content: formData.content,
    excerpt: formData.excerpt,
    createdAt: now,
    updatedAt: now,
    published: formData.published
  }
}

/**
 * 既存記事データからエクスポート用データを作成
 */
export function createExportDataFromArticle(article: {
  title: string
  slug: string
  content: string
  excerpt?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  published: boolean
  author?: {
    name?: string | null
    email: string
  }
}): ArticleData {
  return {
    title: article.title,
    slug: article.slug,
    content: article.content,
    excerpt: article.excerpt || undefined,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    published: article.published,
    author: article.author
  }
}