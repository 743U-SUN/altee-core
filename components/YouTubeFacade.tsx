"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

interface YouTubeFacadeProps {
  videoId: string
  height?: number
  title?: string
}

/**
 * YouTube Facade Pattern Component
 * サムネイル画像を表示し、クリック時にYouTube iframeを読み込む
 */
export function YouTubeFacade({
  videoId,
  height = 400,
  title = "YouTube video"
}: YouTubeFacadeProps) {
  const [isLoaded, setIsLoaded] = useState(false)

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
        style={{ height: `${height}px` }}
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
      style={{ height: `${height}px` }}
      aria-label="動画を再生"
    >
      {/* サムネイル画像 */}
      <Image
        src={thumbnailUrl}
        alt={title}
        fill
        className="object-cover transition-opacity group-hover:opacity-90"
        priority
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
