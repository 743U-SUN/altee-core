'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Tag, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { deleteTag } from "@/app/actions/tag-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Tag as TagType, Pagination } from './types'

interface TagListProps {
  tags: TagType[]
  pagination: Pagination
}

export function TagList({ tags, pagination }: TagListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<TagType | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDeleteClick = (tag: TagType) => {
    setTagToDelete(tag)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteTag(tagToDelete.id)
      toast.success('タグが削除されました')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setTagToDelete(null)
    }
  }

  if (tags.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="mb-2">タグがありません</CardTitle>
          <CardDescription>
            最初のタグを作成してみましょう。
          </CardDescription>
          <Link href="/admin/attributes/tags/new" className="mt-4 inline-block">
            <Button>新規タグ作成</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* タググリッド表示 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {tag.color && (
                      <div 
                        className="w-3 h-3 rounded-full border border-gray-300"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    <CardTitle className="text-lg">{tag.name}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    <code className="bg-muted px-1 py-0.5 rounded">{tag.slug}</code>
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link href={`/admin/attributes/tags/${tag.id}`}>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        編集
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(tag)}
                      className="text-red-600"
                      disabled={tag._count.articles > 0}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {tag.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {tag.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {tag._count.articles}件の記事
                  </Badge>
                  {tag._count.articles > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      使用中
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ページネーション */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {pagination.total}件中 {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/admin/attributes/tags?page=${pagination.page - 1}`}>
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                前へ
              </Button>
            </Link>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Link key={page} href={`/admin/attributes/tags?page=${page}`}>
                    <Button 
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                    >
                      {page}
                    </Button>
                  </Link>
                )
              })}
            </div>
            <Link href={`/admin/attributes/tags?page=${pagination.page + 1}`}>
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
              >
                次へ
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>タグを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{tagToDelete?.name}」を完全に削除します。
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