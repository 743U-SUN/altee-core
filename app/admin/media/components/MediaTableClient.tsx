"use client"

import { useState, useMemo, useCallback } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { deleteMediaFile, bulkDeleteMediaFiles } from "@/app/actions/media-actions"
import { useRouter } from "next/navigation"
import { MediaType } from "@prisma/client"
import { Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"

interface MediaFile {
  id: string
  storageKey: string
  containerName: string
  originalName: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadType: MediaType
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

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface MediaTableClientProps {
  mediaFiles: MediaFile[]
  pagination: Pagination
  search?: string
  containerName?: string
  uploadType?: MediaType
  month?: string
  storageUrl: string
}

export function MediaTableClient({
  mediaFiles,
  pagination,
  search,
  containerName,
  uploadType,
  month,
  storageUrl
}: MediaTableClientProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const router = useRouter()

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedFiles(new Set(mediaFiles.map(file => file.id)))
    } else {
      setSelectedFiles(new Set())
    }
  }, [mediaFiles])

  const handleSelectFile = useCallback((fileId: string, checked: boolean) => {
    setSelectedFiles(prev => {
      const newSelected = new Set(prev)
      if (checked) {
        newSelected.add(fileId)
      } else {
        newSelected.delete(fileId)
      }
      return newSelected
    })
  }, [])

  const handleDeleteFile = async (fileId: string) => {
    setDeletingFileId(fileId)
    try {
      await deleteMediaFile(fileId)
      toast.success('ファイルを削除しました')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ファイルの削除に失敗しました')
    } finally {
      setDeletingFileId(null)
    }
  }

  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      const result = await bulkDeleteMediaFiles(Array.from(selectedFiles))
      toast.success(`${result.deletedCount}件のファイルを削除しました`)
      setSelectedFiles(new Set())
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '一括削除に失敗しました')
    } finally {
      setBulkDeleting(false)
    }
  }

  const isAllSelected = useMemo(() => {
    return mediaFiles.length > 0 && mediaFiles.every(file => selectedFiles.has(file.id))
  }, [mediaFiles, selectedFiles])

  const isIndeterminate = useMemo(() => {
    return selectedFiles.size > 0 && selectedFiles.size < mediaFiles.length
  }, [selectedFiles, mediaFiles])

  if (mediaFiles.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">
          {search || containerName || uploadType || month
            ? '条件に一致するファイルが見つかりません'
            : 'アップロードされたファイルがありません'
          }
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 一括操作バー */}
      {selectedFiles.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium">
            {selectedFiles.size}件のファイルが選択されています
          </span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={bulkDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                選択したファイルを削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ファイルの一括削除</AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedFiles.size}件のファイルを削除しようとしています。
                  この操作は取り消すことができません。実行しますか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除する
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* テーブル */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(ref) => {
                    if (ref) {
                      const inputElement = ref.querySelector('input') as HTMLInputElement
                      if (inputElement) {
                        inputElement.indeterminate = isIndeterminate
                      }
                    }
                  }}
                />
              </TableHead>
              <TableHead className="w-16">プレビュー</TableHead>
              <TableHead>ファイル名</TableHead>
              <TableHead>タイプ</TableHead>
              <TableHead>サイズ</TableHead>
              <TableHead>アップロード者</TableHead>
              <TableHead>使用状況</TableHead>
              <TableHead>アップロード日</TableHead>
              <TableHead className="w-32">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mediaFiles.map((file) => (
              <TableRow key={file.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.has(file.id)}
                    onCheckedChange={(checked) => 
                      handleSelectFile(file.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div 
                    className="relative h-12 w-12 bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => window.open(`${storageUrl}/${file.storageKey}`, '_blank')}
                    title="クリックして画像を表示"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${storageUrl}/${file.storageKey}`}
                      alt={file.originalName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{file.originalName}</div>
                    <div className="text-sm text-muted-foreground">
                      {file.containerName}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={file.uploadType === 'THUMBNAIL' ? 'default' : 'secondary'}>
                    {file.uploadType === 'THUMBNAIL' ? 'サムネイル' : 'コンテンツ'}
                  </Badge>
                </TableCell>
                <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{file.uploader.name || 'Unknown'}</div>
                    <div className="text-muted-foreground">{file.uploader.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {file.articles.length > 0 ? (
                    <div className="space-y-1">
                      <Badge variant="outline">
                        {file.articles.length}記事で使用中
                      </Badge>
                      {file.articles.slice(0, 2).map((article) => (
                        <div key={article.id}>
                          <Link 
                            href={`/admin/articles/${article.id}`}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {article.title.length > 20 
                              ? `${article.title.slice(0, 20)}...` 
                              : article.title
                            }
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      ))}
                      {file.articles.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          他{file.articles.length - 2}件
                        </div>
                      )}
                    </div>
                  ) : (
                    <Badge variant="secondary">未使用</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(file.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={deletingFileId === file.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ファイルの削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{file.originalName}」を削除しようとしています。
                            {file.articles.length > 0 && (
                              <span className="text-destructive">
                                このファイルは{file.articles.length}件の記事で使用されています。
                              </span>
                            )}
                            この操作は取り消すことができません。実行しますか？
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteFile(file.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === pagination.page ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(window.location.search)
                  params.set('page', page.toString())
                  router.push(`?${params.toString()}`)
                }}
              >
                {page}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}