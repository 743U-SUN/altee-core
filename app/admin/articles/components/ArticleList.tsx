'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Edit, Trash2, FileX, Download, ImageOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { deleteArticle, toggleArticlePublished, getArticle } from "@/app/actions/content/article-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { downloadMarkdownFile, createExportDataFromArticle } from "@/lib/markdown-export"
import { getPublicUrl } from "@/lib/image-uploader/get-public-url"
import type { ArticleSummary, Pagination } from './types'

// --- DeleteArticleDialog ---

interface DeleteArticleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  articleTitle?: string
  onConfirm: () => void
  isPending: boolean
}

function DeleteArticleDialog({ open, onOpenChange, articleTitle, onConfirm, isPending }: DeleteArticleDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
          <AlertDialogDescription>
            「{articleTitle}」を完全に削除します。
            この操作は取り消すことができません。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "削除中..." : "削除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// --- ArticleList ---

interface ArticleListProps {
  articles: ArticleSummary[]
  pagination: Pagination
}

export function ArticleList({ articles, pagination }: ArticleListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<ArticleSummary | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDeleteClick = (article: ArticleSummary) => {
    setArticleToDelete(article)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!articleToDelete) return
    startTransition(async () => {
      try {
        await deleteArticle(articleToDelete.id)
        toast.success('記事が削除されました')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '削除に失敗しました')
      } finally {
        setDeleteDialogOpen(false)
        setArticleToDelete(null)
      }
    })
  }

  const handleTogglePublished = (articleId: string) => {
    setTogglingId(articleId)
    startTransition(async () => {
      try {
        await toggleArticlePublished(articleId)
        toast.success('公開状態を変更しました')
        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '公開状態の変更に失敗しました')
      } finally {
        setTogglingId(null)
      }
    })
  }

  const handleExport = async (article: ArticleSummary) => {
    try {
      const fullArticle = await getArticle(article.id)
      const exportData = createExportDataFromArticle(fullArticle)
      downloadMarkdownFile(exportData)
      toast.success('Markdownファイルをエクスポートしました')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'エクスポートに失敗しました')
    }
  }

  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <FileX className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="mb-2">記事がありません</CardTitle>
          <CardDescription>
            最初の記事を作成してみましょう。
          </CardDescription>
          <Link href="/admin/articles/new" className="mt-4 inline-block">
            <Button>新規記事作成</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <Card key={article.id}>
          <div className="flex gap-4 p-4">
            {/* サムネイル */}
            <div className="relative w-28 h-20 shrink-0 bg-muted rounded-md overflow-hidden">
              {article.thumbnail ? (
                <Image
                  src={getPublicUrl(article.thumbnail.storageKey)}
                  alt={article.title}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                  <ImageOff className="h-6 w-6" />
                  <span className="text-[10px] mt-1">NO IMG</span>
                </div>
              )}
            </div>

            {/* コンテンツ */}
            <div className="flex-1 min-w-0">
              <CardHeader className="p-0 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{article.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {article.author.name || article.author.email} •
                      {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                      {article.publishedAt && (
                        <> • 公開: {new Date(article.publishedAt).toLocaleDateString('ja-JP')}</>
                      )}
                    </CardDescription>
                  </div>
                  <TooltipProvider delayDuration={300}>
                    <div className="flex items-center gap-1 shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {article.published ? '公開' : '下書き'}
                            </span>
                            <Switch
                              checked={article.published}
                              onCheckedChange={() => handleTogglePublished(article.id)}
                              disabled={togglingId === article.id}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {article.published ? '非公開にする' : '公開する'}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/admin/articles/${article.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>編集</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleExport(article)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>.mdでエクスポート</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteClick(article)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>削除</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </div>
              </CardHeader>
              {article.excerpt && (
                <CardContent className="p-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                </CardContent>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <div className="flex items-center space-x-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <Link key={page} href={`/admin/articles?page=${page}`}>
                <Button
                  variant={page === pagination.page ? "default" : "outline"}
                  size="sm"
                >
                  {page}
                </Button>
              </Link>
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
          </div>
        </div>
      )}

      <DeleteArticleDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        articleTitle={articleToDelete?.title}
        onConfirm={handleDeleteConfirm}
        isPending={isPending}
      />
    </div>
  )
}
