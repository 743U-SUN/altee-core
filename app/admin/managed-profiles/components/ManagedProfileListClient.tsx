"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Search, Trash2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { deleteManagedProfile } from "@/app/actions/admin/managed-profile-actions"

interface Profile {
  id: string
  handle: string | null
  name: string | null
  characterName: string | null
  iconImageUrl: string | null
  createdAt: string
  managedBy: string | null
}

interface ManagedProfileListClientProps {
  profiles: Profile[]
  search?: string
  pagination: ReactNode
}

export function ManagedProfileListClient({
  profiles,
  search,
  pagination,
}: ManagedProfileListClientProps) {
  const router = useRouter()
  const [searchInput, setSearchInput] = useState(search || "")
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput) params.set("search", searchInput)
    router.push(`/admin/managed-profiles?${params.toString()}`)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteManagedProfile(id)
      toast.success("プロフィールを削除しました")
      router.refresh()
    } catch {
      toast.error("削除に失敗しました")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 検索 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="ハンドルまたはキャラクター名で検索..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline" size="icon">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {profiles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          MANAGEDプロフィールがありません
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>プロフィール</TableHead>
              <TableHead>ハンドル</TableHead>
              <TableHead>タイプ</TableHead>
              <TableHead>作成日</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={profile.iconImageUrl ?? undefined}
                      alt={profile.characterName || "Profile"}
                    />
                    <AvatarFallback>
                      {(profile.characterName || profile.name || "M").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="font-medium">
                    {profile.characterName || profile.name || "名前未設定"}
                  </div>
                </TableCell>
                <TableCell>
                  {profile.handle ? (
                    <code className="text-sm">@{profile.handle}</code>
                  ) : (
                    <span className="text-muted-foreground">未設定</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">MANAGED</Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {new Date(profile.createdAt).toLocaleDateString("ja-JP")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/managed-profiles/${profile.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      編集
                    </Link>
                    {profile.handle && (
                      <Link
                        href={`/@${profile.handle}`}
                        target="_blank"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          disabled={deletingId === profile.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>プロフィールを削除</AlertDialogTitle>
                          <AlertDialogDescription>
                            「{profile.characterName || profile.handle}」を削除しますか？
                            関連データもすべて削除されます。この操作は取り消せません。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(profile.id)}
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
      )}

      {pagination}
    </div>
  )
}
