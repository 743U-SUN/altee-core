"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, Youtube } from "lucide-react"
import { updateYoutubeChannel, addRecommendedVideo, extractChannelIdFromUrl, getMyRssFeedVideos } from "@/app/actions/platform-actions"
import { toast } from "sonner"
import { RecommendedVideosList } from "./RecommendedVideosList"
import Link from "next/link"

interface YouTubeTabContentProps {
  initialData: {
    youtubeChannelId: string | null
    youtubeRssFeedLimit: number
    youtubeRecommendedVideos: Array<{
      id: string
      videoId: string
      title: string | null
      thumbnail: string | null
      sortOrder: number
      isVisible: boolean
    }>
  } | null
}

export function YouTubeTabContent({ initialData }: YouTubeTabContentProps) {
  const [channelInput, setChannelInput] = useState(initialData?.youtubeChannelId || "")
  const [rssFeedLimit, setRssFeedLimit] = useState(initialData?.youtubeRssFeedLimit?.toString() || "6")
  const [videoUrl, setVideoUrl] = useState("")
  const [isSavingChannel, setIsSavingChannel] = useState(false)
  const [isAddingVideo, setIsAddingVideo] = useState(false)
  const [videos, setVideos] = useState(initialData?.youtubeRecommendedVideos || [])
  const [showVideos, setShowVideos] = useState(
    initialData?.youtubeRecommendedVideos?.[0]?.isVisible ?? true
  )
  const [rssFeedVideos, setRssFeedVideos] = useState<Array<{
    videoId: string
    title: string
    thumbnail?: string
  }> | null>(null)
  const [isLoadingRss, setIsLoadingRss] = useState(false)

  // 初回ロード時にRSS Feedを取得
  useEffect(() => {
    const fetchInitialRssFeed = async () => {
      if (initialData?.youtubeChannelId && initialData.youtubeRssFeedLimit > 0) {
        setIsLoadingRss(true)
        const rssResult = await getMyRssFeedVideos()
        if (rssResult.success && rssResult.data) {
          setRssFeedVideos(rssResult.data)
        }
        setIsLoadingRss(false)
      }
    }
    fetchInitialRssFeed()
  }, [initialData?.youtubeChannelId, initialData?.youtubeRssFeedLimit])

  const handleSaveChannel = async () => {
    setIsSavingChannel(true)
    try {
      // Channel ID抽出
      const extractResult = await extractChannelIdFromUrl(channelInput)
      if (!extractResult.success || !extractResult.channelId) {
        toast.error(extractResult.error || "有効なChannel IDまたはURLを入力してください")
        return
      }

      const result = await updateYoutubeChannel({
        channelId: extractResult.channelId,
        rssFeedLimit: parseInt(rssFeedLimit, 10),
      })

      if (result.success) {
        toast.success("YouTube設定を保存しました")
        setChannelInput(extractResult.channelId)

        // RSS Feed動画を取得
        setIsLoadingRss(true)
        const rssResult = await getMyRssFeedVideos()
        if (rssResult.success && rssResult.data) {
          setRssFeedVideos(rssResult.data)
        }
        setIsLoadingRss(false)
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch {
      toast.error("予期しないエラーが発生しました")
    } finally {
      setIsSavingChannel(false)
    }
  }

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) {
      toast.error("YouTube動画のURLを入力してください")
      return
    }

    if (videos.length >= 6) {
      toast.error("おすすめ動画は最大6本まで設定できます")
      return
    }

    setIsAddingVideo(true)
    try {
      const result = await addRecommendedVideo(videoUrl)

      if (result.success && result.data) {
        toast.success("おすすめ動画を追加しました")
        setVideos([...videos, result.data])
        setVideoUrl("")
      } else {
        toast.error(result.error || "追加に失敗しました")
      }
    } catch {
      toast.error("予期しないエラーが発生しました")
    } finally {
      setIsAddingVideo(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* YouTube Channel設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5" />
            YouTubeチャンネル設定
          </CardTitle>
          <CardDescription>
            YouTubeチャンネルIDまたはURLを設定すると、最新動画をRSS Feedから自動取得して表示できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channelId">チャンネルID / URL</Label>
            <Input
              id="channelId"
              placeholder="UCxxxxxx... または https://www.youtube.com/channel/UCxxxxxx..."
              value={channelInput}
              onChange={(e) => setChannelInput(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Channel IDは「UC」で始まる24文字のIDです
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rssFeedLimit">最新動画表示数</Label>
            <Select value={rssFeedLimit} onValueChange={setRssFeedLimit}>
              <SelectTrigger id="rssFeedLimit">
                <SelectValue placeholder="表示数を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">非表示</SelectItem>
                {[...Array(15)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}本
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              チャンネルの最新動画の表示数（0=非表示、1〜15本）
            </p>
          </div>

          {/* RSS Feed動画プレビュー */}
          {rssFeedVideos && rssFeedVideos.length > 0 && (
            <div className="space-y-2">
              <Label>最新動画プレビュー</Label>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rssFeedVideos.map((video) => (
                  <Link
                    key={video.videoId}
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-muted relative">
                      {video.thumbnail && (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {isLoadingRss && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">動画を読み込み中...</span>
            </div>
          )}

          <Button onClick={handleSaveChannel} disabled={isSavingChannel}>
            {isSavingChannel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </CardContent>
      </Card>

      {/* おすすめ動画設定 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>おすすめ動画設定</CardTitle>
              <CardDescription>
                プロフィールページに表示するおすすめ動画を設定します（最大6本）
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="showVideos">表示</Label>
              <Switch
                id="showVideos"
                checked={showVideos}
                onCheckedChange={setShowVideos}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddVideo()
                }
              }}
            />
            <Button
              onClick={handleAddVideo}
              disabled={isAddingVideo || videos.length >= 6}
            >
              {isAddingVideo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  追加
                </>
              )}
            </Button>
          </div>

          {videos.length > 0 ? (
            <RecommendedVideosList
              videos={videos}
              onVideosChange={setVideos}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>まだおすすめ動画が設定されていません</p>
              <p className="text-sm">動画URLを入力して追加してください</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
