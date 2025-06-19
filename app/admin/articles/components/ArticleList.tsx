'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Globe, FileX, Download } from "lucide-react"
import Link from "next/link"
import { deleteArticle, toggleArticlePublished, getArticle } from "@/app/actions/article-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { downloadMarkdownFile, createExportDataFromArticle } from "@/lib/markdown-export"

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published: boolean
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    name: string | null
    email: string
  }
  thumbnail: {
    id: string
    storageKey: string
    originalName: string
  } | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface ArticleListProps {
  articles: Article[]
  pagination: Pagination
}

export function ArticleList({ articles, pagination }: ArticleListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState<string | null>(null)
  const router = useRouter()

  const handleDeleteClick = (article: Article) => {
    setArticleToDelete(article)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteArticle(articleToDelete.id)
      toast.success('記事が削除されました')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setArticleToDelete(null)
    }
  }

  const handleTogglePublished = async (articleId: string) => {
    setIsToggling(articleId)
    try {
      await toggleArticlePublished(articleId)
      toast.success('公開状態を変更しました')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '公開状態の変更に失敗しました')
    } finally {
      setIsToggling(null)
    }
  }

  const handleExport = async (article: Article) => {
    try {
      // 記事詳細を取得してcontentを含める
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
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{article.title}</CardTitle>
                  <Badge variant={article.published ? "default" : "secondary"}>
                    {article.published ? "公開中" : "下書き"}
                  </Badge>
                </div>
                <CardDescription>
                  作成者: {article.author.name || article.author.email} • 
                  作成日: {new Date(article.createdAt).toLocaleDateString('ja-JP')}
                  {article.publishedAt && (
                    <> • 公開日: {new Date(article.publishedAt).toLocaleDateString('ja-JP')}</>
                  )}
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link href={`/admin/articles/${article.id}`}>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem 
                    onClick={() => handleTogglePublished(article.id)}
                    disabled={isToggling === article.id}
                  >
                    {article.published ? (
                      <>
                        <FileX className="mr-2 h-4 w-4" />
                        非公開にする
                      </>
                    ) : (
                      <>
                        <Globe className="mr-2 h-4 w-4" />
                        公開する
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport(article)}>
                    <Download className="mr-2 h-4 w-4" />
                    .mdでエクスポート
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(article)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          {article.excerpt && (
            <CardContent>
              <p className="text-muted-foreground">{article.excerpt}</p>
              <div className="mt-4 text-sm text-muted-foreground">
                スラッグ: <code className="bg-muted px-1 py-0.5 rounded text-xs">{article.slug}</code>
              </div>
            </CardContent>
          )}
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

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記事を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{articleToDelete?.title}」を完全に削除します。
              この操作は取り消すことができません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}