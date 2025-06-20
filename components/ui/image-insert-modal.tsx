'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { getMediaFiles, type MediaFilesFilter } from '@/app/actions/media-actions'
import Image from 'next/image'

interface ImageInsertModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (markdown: string) => void
}

interface MediaFile {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  containerName: string
  storageKey: string
  publicUrl: string
  altText?: string | null
  uploadType: string
  createdAt: Date
  uploader: {
    id: string
    name: string | null
    email: string
  }
  articles: {
    id: string
    title: string
    slug: string
  }[]
}

const CONTAINER_OPTIONS = [
  { value: 'article-images', label: '記事画像' },
  { value: 'article-thumbnails', label: '記事サムネイル' },
  { value: 'images', label: '汎用画像' },
]

const ITEMS_PER_PAGE = 12

export function ImageInsertModal({ open, onOpenChange, onInsert }: ImageInsertModalProps) {
  const [selectedContainer, setSelectedContainer] = useState('article-images')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedImage, setSelectedImage] = useState<MediaFile | null>(null)
  const [altText, setAltText] = useState('')
  const [mediaData, setMediaData] = useState<{ mediaFiles: MediaFile[]; pagination: { total: number; page: number; limit: number; totalPages: number } } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // データフェッチ
  useEffect(() => {
    if (!open) return

    setLoading(true)
    setError(null)

    const fetchData = async () => {
      try {
        const mediaFilter: MediaFilesFilter = {
          containerName: selectedContainer,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        }
        
        const result = await getMediaFiles(mediaFilter)
        setMediaData(result)
      } catch (err) {
        setError('画像の読み込みに失敗しました')
        console.error('Failed to fetch media files:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [open, selectedContainer, currentPage])


  // 既存画像選択時の処理
  const handleImageSelect = (image: MediaFile) => {
    setSelectedImage(image)
    setAltText(image.altText || '')
  }

  // 画像挿入処理
  const handleInsertImage = () => {
    if (!selectedImage) return

    const markdown = `![${altText || '画像の説明'}](${selectedImage.publicUrl})`
    onInsert(markdown)
    onOpenChange(false)
    toast.success('画像を記事に挿入しました')
  }

  // コンテナ変更時の処理
  const handleContainerChange = (container: string) => {
    setSelectedContainer(container)
    setCurrentPage(1)
    setSelectedImage(null)
  }

  // ページ変更処理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    setSelectedImage(null)
  }

  // モーダルクローズ時のリセット
  const handleModalClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setSelectedImage(null)
      setAltText('')
      setCurrentPage(1)
    }
  }

  const totalPages = mediaData?.pagination.totalPages || 0
  const mediaFiles = mediaData?.mediaFiles || []

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            画像を挿入
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4 h-8 w-8 p-0 lg:hidden"
            onClick={() => handleModalClose(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* コンテナ選択 */}
          <div className="flex items-center gap-4 mb-4 flex-shrink-0">
            <Label htmlFor="container-select">コンテナ:</Label>
            <Select value={selectedContainer} onValueChange={handleContainerChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTAINER_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mediaData && (
              <Badge variant="secondary">
                {mediaData.pagination.total}件
              </Badge>
            )}
          </div>

          {/* 画像グリッド */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                読み込み中...
              </div>
            )}

            {!loading && error && (
              <div className="text-center py-8 text-muted-foreground">
                画像の読み込みに失敗しました
              </div>
            )}

            {!loading && !error && mediaFiles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                画像がありません
              </div>
            )}

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3 pb-4">
                {mediaFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleImageSelect(file)}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105
                      ${selectedImage?.id === file.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
                    `}
                  >
                    <Image
                      src={file.publicUrl}
                      alt={file.altText || file.originalName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 25vw"
                      unoptimized
                    />
                    {selectedImage?.id === file.id && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* フッター（画像選択時のみ表示） */}
        {selectedImage && (
          <div className="flex-shrink-0 border-t pt-4 space-y-4">
            <div>
              <Label htmlFor="alt-text">画像の説明 (Alt テキスト)</Label>
              <Input
                id="alt-text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="画像の説明を入力してください"
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => handleModalClose(false)}>
                キャンセル
              </Button>
              <Button onClick={handleInsertImage}>
                画像を挿入
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}