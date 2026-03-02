'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import { UserNewsMarkdownPreview } from '@/components/editor/user-news-markdown-preview'

interface NewsArticleContentProps {
  title: string
  content: string
  thumbnailUrl: string | null
  bodyImageUrl: string | null
  createdAt: Date
}

export function NewsArticleContent({
  title,
  content,
  thumbnailUrl,
  bodyImageUrl,
  createdAt,
}: NewsArticleContentProps) {
  return (
    <article className="w-full">
      {/* サムネイル */}
      {thumbnailUrl && (
        <div className="w-full aspect-video rounded-lg overflow-hidden mb-6">
          <Image
            src={thumbnailUrl}
            alt={title}
            width={800}
            height={450}
            className="object-cover w-full h-full"
            priority
          />
        </div>
      )}

      {/* タイトル */}
      <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] mb-2">
        {title}
      </h1>
      <time className="text-sm text-[var(--theme-text-secondary)] block mb-6">
        {new Date(createdAt).toLocaleDateString('ja-JP')}
      </time>

      {/* 本文 */}
      <Suspense
        fallback={
          <div className="text-[var(--theme-text-secondary)] text-center py-12">
            読み込み中...
          </div>
        }
      >
        <UserNewsMarkdownPreview content={content} bodyImageUrl={bodyImageUrl} />
      </Suspense>
    </article>
  )
}
