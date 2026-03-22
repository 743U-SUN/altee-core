'use client'

import { lazy } from 'react'
import remarkGfm from 'remark-gfm'
import { YouTubeEmbed } from '@next/third-parties/google'
import type { Components } from 'react-markdown'

const ReactMarkdown = lazy(() => import('react-markdown'))

interface UserNewsMarkdownPreviewProps {
  content: string
  bodyImageUrl?: string | null
  className?: string
}

/**
 * YouTube ID を URL やショート URL から抽出。11文字の直接IDにも対応。
 */
function extractYoutubeId(input: string): string | null {
  // youtube.com/watch?v=ID
  const watchMatch = input.match(
    /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/
  )
  if (watchMatch) return watchMatch[1]

  // youtu.be/ID
  const shortMatch = input.match(/(?:youtu\.be\/)([\w-]{11})/)
  if (shortMatch) return shortMatch[1]

  // youtube.com/shorts/ID
  const shortsMatch = input.match(
    /(?:youtube\.com\/shorts\/)([\w-]{11})/
  )
  if (shortsMatch) return shortsMatch[1]

  // 直接 ID (11文字の英数字+ハイフン+アンダースコア)
  if (/^[\w-]{11}$/.test(input)) return input

  return null
}

// YouTube プレースホルダーのセパレーター
const YT_PLACEHOLDER_PREFIX = '___YOUTUBE_EMBED___'
const YT_PLACEHOLDER_SUFFIX = '___END_YOUTUBE___'

type ContentSegment =
  | { type: 'markdown'; content: string }
  | { type: 'youtube'; videoId: string }

/**
 * コンテンツを前処理してセグメントに分割:
 * 1. [image] → ![](bodyImageUrl) or 空文字
 * 2. [youtube=ID] → YouTube セグメントに分割
 */
function preprocessContent(
  content: string,
  bodyImageUrl?: string | null
): ContentSegment[] {
  let processed = content

  // [image] を画像マークダウンに変換
  if (bodyImageUrl) {
    processed = processed.replace(/\[image\]/g, `![](${bodyImageUrl})`)
  } else {
    processed = processed.replace(/\[image\]/g, '')
  }

  // [youtube=xxx] をプレースホルダーに変換
  processed = processed.replace(
    /\[youtube=(.*?)\]/g,
    (_match, idOrUrl: string) => {
      const videoId = extractYoutubeId(idOrUrl.trim())
      if (!videoId) return ''
      return `\n${YT_PLACEHOLDER_PREFIX}${videoId}${YT_PLACEHOLDER_SUFFIX}\n`
    }
  )

  // プレースホルダーで分割してセグメント配列に変換
  const regex = new RegExp(
    `${YT_PLACEHOLDER_PREFIX}([\\w-]{11})${YT_PLACEHOLDER_SUFFIX}`,
    'g'
  )
  const segments: ContentSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(processed)) !== null) {
    // マッチ前のテキスト
    if (match.index > lastIndex) {
      const text = processed.slice(lastIndex, match.index).trim()
      if (text) segments.push({ type: 'markdown', content: text })
    }
    segments.push({ type: 'youtube', videoId: match[1] })
    lastIndex = match.index + match[0].length
  }

  // 残りのテキスト
  const remaining = processed.slice(lastIndex).trim()
  if (remaining) segments.push({ type: 'markdown', content: remaining })

  // セグメントがない場合は空のMarkdownを返す
  if (segments.length === 0) {
    segments.push({ type: 'markdown', content: '' })
  }

  return segments
}

/** ReactMarkdown の code レンダラー (モジュールレベル定数で React Compiler と競合しない) */
const markdownComponents: Components = {
  code(props) {
    const { children, className: codeClassName } = props
    const match = /language-(\w+)/.exec(codeClassName || '')
    return match ? (
      <pre className="rounded-md overflow-hidden bg-gray-900 p-4 text-sm leading-relaxed">
        <code className={codeClassName}>{children}</code>
      </pre>
    ) : (
      <code
        className={`${codeClassName || ''} bg-gray-100 px-1 py-0.5 rounded text-sm`}
      >
        {children}
      </code>
    )
  },
}

export function UserNewsMarkdownPreview({
  content,
  bodyImageUrl,
  className = '',
}: UserNewsMarkdownPreviewProps) {
  const segments = preprocessContent(content, bodyImageUrl)

  return (
    <div
      className={`prose prose-slate max-w-none dark:prose-invert ${className}`}
    >
      {segments.map((segment, index) => {
        if (segment.type === 'youtube') {
          return (
            <div
              key={`yt-${index}`}
              className="w-full aspect-video my-4 rounded-lg overflow-hidden not-prose [&_lite-youtube]:!w-full [&_lite-youtube]:!h-full [&_lite-youtube]:!max-w-none [&_iframe]:!w-full [&_iframe]:!h-full"
            >
              <YouTubeEmbed videoid={segment.videoId} params="rel=0" />
            </div>
          )
        }

        return (
          <ReactMarkdown
            key={`md-${index}`}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
            disallowedElements={[
              'script',
              'iframe',
              'object',
              'embed',
              'form',
              'input',
              'meta',
              'style',
              'link',
              'base',
              'frame',
              'frameset',
            ]}
            unwrapDisallowed={true}
          >
            {segment.content}
          </ReactMarkdown>
        )
      })}
    </div>
  )
}
