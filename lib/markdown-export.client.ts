'use client'

/**
 * Markdown Export - クライアント専用
 * ブラウザDOM APIを使ったファイルダウンロード処理
 */

import type { ArticleData } from './markdown-export'
import { getArticleContentAsMarkdown, generateFilename } from './markdown-export'

/**
 * ブラウザでMarkdownファイルをダウンロード
 */
export function downloadMarkdownFile(article: ArticleData): void {
  const content = getArticleContentAsMarkdown(article)
  const filename = generateFilename(article)

  // BlobでMarkdownファイルを作成
  const blob = new Blob([content], {
    type: 'text/markdown;charset=utf-8',
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
}
