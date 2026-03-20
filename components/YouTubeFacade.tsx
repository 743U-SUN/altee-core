"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { YOUTUBE_VIDEO_ID_PATTERN } from "@/services/youtube/constants"

interface YouTubeFacadeProps {
  videoId: string
  title?: string
  priority?: boolean
}

/**
 * YouTube Facade Pattern Component
 * サムネイル画像を表示し、クリック時にYouTube iframeを読み込む
 * アスペクト比は16:9で固定
 */
export function YouTubeFacade({
  videoId,
  title = "YouTube video",
  priority = false,
}: YouTubeFacadeProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  if (!YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
    return null
  }

  // サムネイル画像のURL (maxresdefault > sddefault > hqdefault の優先順)
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`

  const handleClick = () => {
    setIsLoaded(true)
  }

  if (isLoaded) {
    // iframeを読み込む
    return (
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: '16 / 9' }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    )
  }

  // サムネイルを表示
  return (
    <button
      onClick={handleClick}
      className="relative w-full bg-black rounded-lg overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '16 / 9' }}
      aria-label="動画を再生"
    >
      {/* サムネイル画像 */}
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className="object-cover transition-opacity group-hover:opacity-90"
        sizes="(max-width: 768px) 100vw, 640px"
        priority={priority}
      />

      {/* 再生ボタン */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-red-600 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
          <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
        </div>
      </div>
    </button>
  )
}
