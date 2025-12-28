"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateUserHandle } from "@/app/actions/user-management"
import { AtSign, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface HandleEditorProps {
  user: {
    id: string
    handle: string | null
    name: string | null
  }
}

export function HandleEditor({ user }: HandleEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newHandle, setNewHandle] = useState("")
  const [reason, setReason] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleUpdate = async () => {
    if (!newHandle.trim()) {
      toast.error("新しいハンドルを入力してください")
      return
    }

    if (!reason.trim() || reason.trim().length < 5) {
      toast.error("変更理由は5文字以上で入力してください")
      return
    }

    setIsLoading(true)
    try {
      const result = await updateUserHandle(user.id, newHandle.trim(), reason.trim())
      toast.success(
        `ハンドルを更新しました: ${result.oldHandle || "(未設定)"} → ${result.newHandle}`
      )
      setNewHandle("")
      setReason("")
      setIsDialogOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ハンドルの更新に失敗しました")
      console.error("Handle update error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setNewHandle("")
    setReason("")
    setIsDialogOpen(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AtSign className="h-5 w-5" />
          ハンドル変更
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 現在のハンドル表示 */}
        <div className="p-3 bg-muted rounded-lg">
          <Label className="text-sm font-medium text-muted-foreground">現在のハンドル</Label>
          <div className="mt-1 flex items-center gap-2">
            <AtSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm">
              {user.handle || "(未設定)"}
            </span>
          </div>
          {user.handle && (
            <p className="text-xs text-muted-foreground mt-1">
              プロフィールURL: /{user.handle}
            </p>
          )}
        </div>

        {/* 警告メッセージ */}
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
          <div className="text-xs text-yellow-800 dark:text-yellow-200">
            <p className="font-medium">注意事項</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>ハンドル変更後、プロフィールURLが変更されます</li>
              <li>既存のURLからはアクセスできなくなります</li>
              <li>予約語や既存のハンドルは使用できません</li>
            </ul>
          </div>
        </div>

        {/* 変更ダイアログ */}
        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <AtSign className="h-4 w-4 mr-2" />
              ハンドルを変更
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ハンドル変更の確認</AlertDialogTitle>
              <AlertDialogDescription>
                ユーザーのハンドルを変更します。この操作はユーザーのプロフィールURLに影響します。
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {/* 現在 → 新規 の表示 */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">現在:</span>
                    <span className="font-mono">
                      {user.handle || "(未設定)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">変更後:</span>
                    <span className="font-mono font-medium">
                      {newHandle || "(入力してください)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 新しいハンドル入力 */}
              <div className="space-y-2">
                <Label htmlFor="new-handle">新しいハンドル *</Label>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-handle"
                    placeholder="例: myhandle123"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    disabled={isLoading}
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  3〜20文字、英数字とアンダースコアのみ使用可能
                </p>
              </div>

              {/* 変更理由入力 */}
              <div className="space-y-2">
                <Label htmlFor="reason">変更理由 *</Label>
                <Textarea
                  id="reason"
                  placeholder="変更理由を入力してください（5文字以上必須）"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  監査ログに記録されます
                </p>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
                キャンセル
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUpdate}
                disabled={isLoading || !newHandle.trim() || !reason.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    更新中...
                  </>
                ) : (
                  "変更実行"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
