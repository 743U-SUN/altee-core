'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Folder } from "lucide-react"
import Link from "next/link"
import { deleteCategory } from "@/app/actions/content/category-actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Category, Pagination } from './types'
import { AttributePagination } from '../../components/AttributePagination'

interface CategoryListProps {
  categories: Category[]
  pagination: Pagination
}

export function CategoryList({ categories, pagination }: CategoryListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    
    setIsDeleting(true)
    try {
      await deleteCategory(categoryToDelete.id)
      toast.success('カテゴリが削除されました')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle className="mb-2">カテゴリがありません</CardTitle>
          <CardDescription>
            最初のカテゴリを作成してみましょう。
          </CardDescription>
          <Link href="/admin/attributes/categories/new" className="mt-4 inline-block">
            <Button>新規カテゴリ作成</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <Card key={category.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  {category.color && (
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <Badge variant="outline">
                    {category._count.articles}件の記事
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    順序: {category.order}
                  </Badge>
                </div>
                <CardDescription>
                  スラッグ: <code className="bg-muted px-1 py-0.5 rounded text-xs">{category.slug}</code>
                  {category.description && (
                    <> • {category.description}</>
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
                  <Link href={`/admin/attributes/categories/${category.id}`}>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      編集
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600"
                    disabled={category._count.articles > 0}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                    {category._count.articles > 0 && (
                      <span className="ml-2 text-xs">(記事で使用中)</span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
        </Card>
      ))}

      {/* ページネーション */}
      <AttributePagination
        pagination={pagination}
        basePath="/admin/attributes/categories"
      />

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>カテゴリを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{categoryToDelete?.name}」を完全に削除します。
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