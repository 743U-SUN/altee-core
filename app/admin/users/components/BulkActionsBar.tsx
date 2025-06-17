"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { bulkUpdateUserRole, bulkToggleUserActive } from "@/app/actions/user-management"
import { UserRole } from "@prisma/client"
import { Users, Settings, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  isActive: boolean
}

interface BulkActionsBarProps {
  selectedUserIds: string[]
  selectedUsers: User[]
  onComplete: () => void
}

export function BulkActionsBar({ selectedUserIds, selectedUsers, onComplete }: BulkActionsBarProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole | "">("")
  const [selectedActiveState, setSelectedActiveState] = useState<"active" | "inactive" | "">("")
  const router = useRouter()

  const handleBulkRoleChange = async () => {
    if (!selectedRole || selectedUserIds.length === 0) return

    setIsLoading(true)
    try {
      await bulkUpdateUserRole(selectedUserIds, selectedRole)
      toast.success(`${selectedUserIds.length}人のユーザーのロールを${selectedRole}に変更しました`)
      router.refresh()
      onComplete()
    } catch (error) {
      console.error("Bulk role change error:", error)
      toast.error("一括ロール変更に失敗しました")
    } finally {
      setIsLoading(false)
      setSelectedRole("")
    }
  }

  const handleBulkActiveToggle = async () => {
    if (!selectedActiveState || selectedUserIds.length === 0) return

    const isActive = selectedActiveState === "active"
    setIsLoading(true)
    try {
      await bulkToggleUserActive(selectedUserIds, isActive)
      toast.success(`${selectedUserIds.length}人のユーザーを${isActive ? "アクティブ" : "非アクティブ"}にしました`)
      router.refresh()
      onComplete()
    } catch (error) {
      console.error("Bulk active toggle error:", error)
      toast.error("一括状態変更に失敗しました")
    } finally {
      setIsLoading(false)
      setSelectedActiveState("")
    }
  }

  const roleStats = selectedUsers.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<UserRole, number>)

  const activeStats = selectedUsers.reduce((acc, user) => {
    if (user.isActive) {
      acc.active++
    } else {
      acc.inactive++
    }
    return acc
  }, { active: 0, inactive: 0 })

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">
                {selectedUserIds.length}人のユーザーを選択中
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {Object.entries(roleStats).map(([role, count]) => (
                <Badge key={role} variant="outline" className="text-xs">
                  {role}: {count}
                </Badge>
              ))}
              <Badge variant="outline" className="text-xs">
                アクティブ: {activeStats.active}
              </Badge>
              <Badge variant="outline" className="text-xs">
                非アクティブ: {activeStats.inactive}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ロール一括変更 */}
            <div className="flex items-center gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="ロール変更" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                  <SelectItem value="GUEST">GUEST</SelectItem>
                </SelectContent>
              </Select>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedRole || isLoading}
                  >
                    実行
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>一括ロール変更の確認</AlertDialogTitle>
                    <AlertDialogDescription>
                      選択した{selectedUserIds.length}人のユーザーのロールを「{selectedRole}」に変更しますか？
                      この操作は取り消すことができません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkRoleChange}>
                      変更実行
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* 状態一括変更 */}
            <div className="flex items-center gap-2">
              <Select value={selectedActiveState} onValueChange={setSelectedActiveState}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="状態変更" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">アクティブ</SelectItem>
                  <SelectItem value="inactive">非アクティブ</SelectItem>
                </SelectContent>
              </Select>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!selectedActiveState || isLoading}
                  >
                    実行
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>一括状態変更の確認</AlertDialogTitle>
                    <AlertDialogDescription>
                      選択した{selectedUserIds.length}人のユーザーを「{selectedActiveState === "active" ? "アクティブ" : "非アクティブ"}」に変更しますか？
                      この操作は取り消すことができません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkActiveToggle}>
                      変更実行
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onComplete}
              className="text-blue-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}