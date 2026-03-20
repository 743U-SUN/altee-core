'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateSection } from '@/app/actions/user/section-actions'
import { getYouTubeMetadata } from '@/app/actions/social/youtube-actions'
import { toast } from 'sonner'
import type { YoutubeSectionData } from '@/types/profile-sections'
import Image from 'next/image'
import { Loader2, Search } from 'lucide-react'

interface YoutubeSectionModalProps {
    isOpen: boolean
    onClose: () => void
    sectionId: string
    currentData: YoutubeSectionData
}

export function YoutubeSectionModal({
    isOpen,
    onClose,
    sectionId,
    currentData,
}: YoutubeSectionModalProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

    // 編集用ステート
    const [url, setUrl] = useState(currentData.url || '')
    const [videoId, setVideoId] = useState(currentData.videoId || '')
    const [title, setTitle] = useState(currentData.title || '')
    const [thumbnail, setThumbnail] = useState(currentData.thumbnail || '')

    // メタデータ取得
    const handleFetchMetadata = async () => {
        if (!url) return

        setIsLoadingMetadata(true)
        try {
            const result = await getYouTubeMetadata(url)

            if (result.success && result.data) {
                setVideoId(result.data.videoId)
                // タイトルが未入力の場合のみ自動入力、または強制上書きするか？
                // 要件: "タイトルはURLから自動的に取得するけれど、自分でタイトルをつけ直すことも可能"
                // ユーザーが意図して消したかもしれないので、空の場合だけセットするか、
                // 常にセットして変更可能にするか。ここは「取得ボタン」を押したときはセットする挙動が自然。
                setTitle(result.data.title || '')
                setThumbnail(result.data.thumbnail || '')
                toast.success("動画情報を取得しました")
            } else {
                toast.error(result.error || "動画情報の取得に失敗しました")
            }
        } catch {
            toast.error("エラーが発生しました")
        } finally {
            setIsLoadingMetadata(false)
        }
    }

    const handleSave = () => {
        if (!videoId) {
            toast.error("YouTube動画のURLを入力して動画を取得してください")
            return
        }

        startTransition(async () => {
            try {
                const newData: YoutubeSectionData = {
                    url,
                    videoId,
                    title, // 空文字の場合は非表示になる（YoutubeSection側で制御）
                    thumbnail,
                    aspectRatio: '16:9',
                }

                const result = await updateSection(sectionId, { data: newData })

                if (result.success) {
                    toast.success('YouTubeセクションを更新しました')
                    onClose()
                    router.refresh()
                } else {
                    toast.error(result.error || '更新に失敗しました')
                }
            } catch {
                toast.error('更新中にエラーが発生しました')
            }
        })
    }

    return (
        <EditModal
            isOpen={isOpen}
            onClose={onClose}
            title="YouTube動画を編集"
            hideActions
        >
            <div className="space-y-6">
                {/* URL入力 */}
                <div className="space-y-2">
                    <Label htmlFor="youtube-url">YouTube URL</Label>
                    <div className="flex gap-2">
                        <Input
                            id="youtube-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault()
                                    handleFetchMetadata()
                                }
                            }}
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleFetchMetadata}
                            disabled={isLoadingMetadata || !url}
                        >
                            {isLoadingMetadata ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            <span className="sr-only">取得</span>
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        URLを入力して取得ボタンを押すと、動画情報が自動入力されます。
                    </p>
                </div>

                {/* プレビュー & タイトル編集 */}
                {videoId && (
                    <div className="space-y-4 border rounded-md p-4 bg-muted/20">
                        <div className="aspect-video relative bg-black rounded-md overflow-hidden">
                            {thumbnail ? (
                                <Image
                                    src={thumbnail}
                                    alt="Video thumbnail"
                                    fill
                                    className="object-cover opacity-80"
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-800" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[14px] border-l-white border-b-8 border-b-transparent ml-1" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="video-title">タイトル</Label>
                            <Input
                                id="video-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="動画のタイトル（空欄で非表示）"
                            />
                            <p className="text-xs text-muted-foreground">
                                タイトルを空にすると、プロフィール上でタイトルは表示されません。
                            </p>
                        </div>
                    </div>
                )}

                {/* 保存ボタン */}
                <div className="flex gap-2 pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isPending}
                        className="flex-1"
                    >
                        キャンセル
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isPending || !videoId}
                        className="flex-1"
                    >
                        {isPending ? '保存中...' : '保存'}
                    </Button>
                </div>
            </div>
        </EditModal>
    )
}
