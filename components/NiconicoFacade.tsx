"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { NICONICO_EMBED_URL, NICONICO_VIDEO_ID_PATTERN } from "@/services/niconico/constants"

interface NiconicoFacadeProps {
  videoId: string
  title?: string
  thumbnailUrl?: string
}

/**
 * ニコニコ動画 Facade Pattern Component
 * サムネイル画像を表示し、クリック時にニコニコ動画 iframe を読み込む
 * アスペクト比は16:9で固定
 */
export function NiconicoFacade({
  videoId,
  title = "ニコニコ動画",
  thumbnailUrl,
}: NiconicoFacadeProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // iframe src に渡す前に videoId を検証（防御的多層セキュリティ）
  if (!NICONICO_VIDEO_ID_PATTERN.test(videoId)) {
    return null
  }

  const handleClick = () => {
    setIsLoaded(true)
  }

  if (isLoaded) {
    return (
      <div
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: '16 / 9' }}
      >
        <iframe
          src={`${NICONICO_EMBED_URL}/${videoId}`}
          title={title}
          allow="autoplay"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="relative w-full bg-black rounded-lg overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '16 / 9' }}
      aria-label="動画を再生"
    >
      {thumbnailUrl && (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-opacity group-hover:opacity-90"
        />
      )}

      {/* 再生ボタン */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-800/80 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
          <Play className="w-8 h-8 md:w-10 md:h-10 text-white fill-white ml-1" />
        </div>
      </div>
    </button>
  )
}
