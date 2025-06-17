"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  updateUserRole, 
  toggleUserActive, 
  deleteUser, 
  forceLogout 
} from "@/app/actions/user-management"
import { addBlacklistedEmail } from "@/app/actions/blacklist"
import { UserRole } from "@prisma/client"
import { Trash2, LogOut, Shield, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface UserActionsProps {
  user: {
    id: string
    name: string | null
    email: string
    role: UserRole
    isActive: boolean
  }
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [addToBlacklist, setAddToBlacklist] = useState(false)

  const handleRoleChange = async (newRole: UserRole) => {
    if (newRole === user.role) return

    setIsLoading(true)
    try {
      await updateUserRole(user.id, newRole)
      toast.success(`ロールを${newRole}に変更しました`)
      router.refresh()
    } catch (error) {
      toast.error("ロール変更に失敗しました")
      console.error("Role change error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActiveToggle = async () => {
    setIsLoading(true)
    try {
      await toggleUserActive(user.id)
      toast.success(`アカウントを${user.isActive ? "無効" : "有効"}にしました`)
      router.refresh()
    } catch (error) {
      toast.error("状態変更に失敗しました")
      console.error("Active toggle error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceLogout = async () => {
    setIsLoading(true)
    try {
      const result = await forceLogout(user.id)
      toast.success(`${result.deletedSessionsCount}個のセッションを削除しました`)
      router.refresh()
    } catch (error) {
      toast.error("強制ログアウトに失敗しました")
      console.error("Force logout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteReason.trim() || deleteReason.trim().length < 5) {
      toast.error("削除理由は5文字以上で入力してください")
      return
    }

    setIsLoading(true)
    try {
      // ユーザー削除実行
      await deleteUser(user.id, deleteReason.trim())
      
      // ブラックリスト追加（選択された場合）
      if (addToBlacklist && user.email) {
        try {
          await addBlacklistedEmail(user.email, deleteReason.trim())
          toast.success("ユーザーを削除し、ブラックリストに追加しました")
        } catch (blacklistError) {
          console.error("Blacklist addition error:", blacklistError)
          toast.success("ユーザーを削除しました（ブラックリスト追加は失敗）")
        }
      } else {
        toast.success("ユーザーを削除しました")
      }
      
      router.push("/admin/users")
    } catch (error) {
      toast.error("ユーザー削除に失敗しました")
      console.error("Delete user error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          管理操作
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ロール変更 */}
        <div className="space-y-2">
          <Label htmlFor="role-select">ロール変更</Label>
          <Select 
            value={user.role} 
            onValueChange={(value) => handleRoleChange(value as UserRole)}
            disabled={isLoading}
          >
            <SelectTrigger id="role-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">ユーザー</SelectItem>
              <SelectItem value="ADMIN">管理者</SelectItem>
              <SelectItem value="GUEST">ゲスト</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* アカウント状態切り替え */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="active-switch">アカウント状態</Label>
            <div className="flex items-center gap-2">
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "アクティブ" : "非アクティブ"}
              </Badge>
            </div>
          </div>
          <Switch
            id="active-switch"
            checked={user.isActive}
            onCheckedChange={handleActiveToggle}
            disabled={isLoading}
          />
        </div>

        {/* 危険な操作 */}
        <div className="border-t pt-6 space-y-3">
          <h4 className="text-sm font-medium text-destructive">危険な操作</h4>
          
          {/* 強制ログアウト */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4 mr-2" />
                )}
                強制ログアウト
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>強制ログアウトの確認</AlertDialogTitle>
                <AlertDialogDescription>
                  このユーザーのすべてのセッションを削除し、強制的にログアウトさせます。
                  ユーザーは再度ログインする必要があります。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={handleForceLogout}>
                  実行
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* ユーザー削除 */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                ユーザー削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>ユーザー削除の確認</AlertDialogTitle>
                <AlertDialogDescription>
                  このユーザーとすべての関連データを完全に削除します。
                  この操作は取り消すことができません。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="delete-reason">削除理由（必須）</Label>
                  <Textarea
                    id="delete-reason"
                    placeholder="削除理由を入力してください（5文字以上）"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                  <Checkbox
                    id="add-to-blacklist"
                    checked={addToBlacklist}
                    onCheckedChange={(checked) => setAddToBlacklist(checked === true)}
                    disabled={!user.email}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="add-to-blacklist" className="text-sm font-medium cursor-pointer">
                      メールアドレスをブラックリストに追加
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {user.email ? `${user.email} を今後のサインアップから除外します` : "メールアドレスが不明のため使用できません"}
                    </p>
                  </div>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setDeleteReason("")
                  setAddToBlacklist(false)
                }}>
                  キャンセル
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUser}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  削除実行
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}