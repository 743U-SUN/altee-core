'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  extractChannelIdFromUrl,
  updateYouTubeLatestSection,
  fetchPublicYoutubeRss,
} from '@/app/actions/social/youtube-actions'
import { toast } from 'sonner'
import type { YouTubeLatestData } from '@/types/profile-sections'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

interface YouTubeLatestEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: YouTubeLatestData
}

export function YouTubeLatestEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: YouTubeLatestEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [channelInput, setChannelInput] = useState(currentData.channelId || '')
  const [rssFeedLimit, setRssFeedLimit] = useState(currentData.rssFeedLimit?.toString() || '6')
  const [previewVideos, setPreviewVideos] = useState<Array<{ videoId: string; title: string; thumbnail?: string }>>([])
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  // preview で検証済みの channelId をキャッシュし、save 時の再抽出をスキップ
  const [resolvedChannelId, setResolvedChannelId] = useState<string | null>(currentData.channelId || null)

  const handleChannelInputChange = (value: string) => {
    setChannelInput(value)
    // 入力変更時はキャッシュをクリア（再検証が必要）
    setResolvedChannelId(null)
  }

  const handleLoadPreview = async () => {
    if (!channelInput.trim()) {
      toast.error('チャンネルIDまたはURLを入力してください')
      return
    }

    setIsLoadingPreview(true)
    try {
      const extractResult = await extractChannelIdFromUrl(channelInput)
      if (!extractResult.success || !extractResult.channelId) {
        toast.error(extractResult.error || '有効なChannel IDではありません')
        return
      }

      setChannelInput(extractResult.channelId)
      setResolvedChannelId(extractResult.channelId)
      const rssResult = await fetchPublicYoutubeRss(extractResult.channelId, parseInt(rssFeedLimit, 10))
      if (rssResult.success && rssResult.data) {
        setPreviewVideos(rssResult.data)
      } else {
        toast.error('RSS Feedの取得に失敗しました')
      }
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        // preview で検証済みの channelId があればそれを使用、なければ再抽出
        let channelId = channelInput.trim()
        if (channelId) {
          if (resolvedChannelId && channelInput === resolvedChannelId) {
            channelId = resolvedChannelId
          } else {
            const extractResult = await extractChannelIdFromUrl(channelId)
            if (!extractResult.success || !extractResult.channelId) {
              toast.error(extractResult.error || '有効なChannel IDではありません')
              return
            }
            channelId = extractResult.channelId
          }
        }

        const result = await updateYouTubeLatestSection(sectionId, {
          channelId,
          rssFeedLimit: parseInt(rssFeedLimit, 10),
        })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '更新に失敗しました')
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
      }
    })
  }

  return (
    <EditModal isOpen={isOpen} onClose={onClose} title="YouTube最新動画を編集" hideActions>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="channelId">チャンネルID / URL</Label>
          <Input
            id="channelId"
            placeholder="UCxxxxxx... または https://www.youtube.com/channel/UCxxxxxx..."
            value={channelInput}
            onChange={(e) => handleChannelInputChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Channel IDは「UC」で始まる24文字のIDです
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rssFeedLimit">表示数</Label>
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
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleLoadPreview}
          disabled={isLoadingPreview || !channelInput.trim()}
          className="w-full"
        >
          {isLoadingPreview ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              読み込み中...
            </>
          ) : (
            'プレビューを読み込む'
          )}
        </Button>

        {previewVideos.length > 0 && (
          <div className="space-y-2">
            <Label>プレビュー</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto">
              {previewVideos.map((video) => (
                <Link
                  key={video.videoId}
                  href={`https://www.youtube.com/watch?v=${video.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-muted relative">
                    {video.thumbnail && (
                      <Image
                        src={video.thumbnail}
                        alt={video.title}
                        fill
                        sizes="200px"
                        className="object-cover group-hover:opacity-90 transition-opacity"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {video.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="flex-1">
            {isPending ? '処理中...' : '完了'}
          </Button>
        </div>
      </div>
    </EditModal>
  )
}
