"use client"

import { TableCell, TableRow } from "@/components/ui/table"
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
import { Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { uploadTypeLabels } from "./upload-type-labels"
import { formatFileSize } from "@/lib/format-utils"
import type { MediaFile } from "@/types/media"

interface MediaTableRowProps {
  file: MediaFile
  storageUrl: string
  isSelected: boolean
  onSelectChange: (checked: boolean) => void
  onDelete: (fileId: string) => void
  isDeleting: boolean
}

export function MediaTableRow({
  file,
  storageUrl,
  isSelected,
  onSelectChange,
  onDelete,
  isDeleting
}: MediaTableRowProps) {
  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectChange}
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
            loading="lazy"
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
          {uploadTypeLabels[file.uploadType] ?? file.uploadType}
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
                disabled={isDeleting}
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
                  onClick={() => onDelete(file.id)}
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
  )
}
