"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { removeBlacklistedEmail } from "@/app/actions/blacklist"
import { toast } from "sonner"
import { Trash2, Mail, Calendar } from "lucide-react"

interface BlacklistedEmail {
  id: string
  email: string
  reason: string | null
  createdAt: Date
}

interface BlacklistTableClientProps {
  blacklistedEmails: BlacklistedEmail[]
}

export function BlacklistTableClient({ blacklistedEmails }: BlacklistTableClientProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string, email: string) => {
    setDeletingId(id)
    try {
      await removeBlacklistedEmail(id)
      toast.success(`${email}をブラックリストから削除しました`)
      router.refresh()
    } catch (error) {
      console.error("ブラックリスト削除エラー:", error)
      toast.error("削除に失敗しました")
    } finally {
      setDeletingId(null)
    }
  }

  if (blacklistedEmails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Mail className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>ブラックリストに登録されているメールアドレスはありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {blacklistedEmails.length}件のメールアドレスがブラックリストに登録されています
      </div>
      
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>理由</TableHead>
              <TableHead>登録日</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blacklistedEmails.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{item.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {item.reason ? (
                    <div className="max-w-xs">
                      <p className="text-sm text-muted-foreground truncate" title={item.reason}>
                        {item.reason}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      理由なし
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                  </div>
                </TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingId === item.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ブラックリストから削除</AlertDialogTitle>
                        <AlertDialogDescription>
                          メールアドレス「{item.email}」をブラックリストから削除しますか？
                          <br />
                          削除後、このメールアドレスでの新規登録が可能になります。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(item.id, item.email)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}