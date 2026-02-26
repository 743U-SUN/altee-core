"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import {
  updateTwitchChannel,
  updateLivePriority
} from "@/app/actions/social/twitch-actions"
import {
  createTwitchEventSubSubscription,
  deleteTwitchEventSubSubscription,
  getTwitchEventSubSubscriptionStatus
} from "@/app/actions/social/twitch-actions"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Twitch アイコン
function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
    </svg>
  )
}

interface TwitchTabContentProps {
  initialData: {
    twitchUsername: string | null
    twitchUserId: string | null
    livePriority: string
  } | null
}

export function TwitchTabContent({ initialData }: TwitchTabContentProps) {
  const [username, setUsername] = useState(initialData?.twitchUsername || "")
  const [livePriority, setLivePriority] = useState<"youtube" | "twitch">(
    (initialData?.livePriority as "youtube" | "twitch") || "youtube"
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPriority, setIsSavingPriority] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoadingSubStatus, setIsLoadingSubStatus] = useState(false)
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false)
  const [isDeletingWebhook, setIsDeletingWebhook] = useState(false)
  const [twitchUserId, setTwitchUserId] = useState(initialData?.twitchUserId || null)

  // EventSub購読ステータスをロード
  useEffect(() => {
    const loadSubStatus = async () => {
      if (!twitchUserId) return

      setIsLoadingSubStatus(true)
      const result = await getTwitchEventSubSubscriptionStatus()
      if (result.success) {
        setIsSubscribed(result.isSubscribed)
      }
      setIsLoadingSubStatus(false)
    }

    loadSubStatus()
  }, [twitchUserId])

  const handleSaveChannel = async () => {
    if (!username.trim()) {
      toast.error("Twitch Usernameを入力してください")
      return
    }

    setIsSaving(true)
    try {
      const result = await updateTwitchChannel({ username: username.trim() })

      if (result.success) {
        toast.success("Twitch設定を保存しました")
        if (result.data?.twitchUserId) {
          setTwitchUserId(result.data.twitchUserId)
        }
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch {
      toast.error("予期しないエラーが発生しました")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateWebhook = async () => {
    if (!twitchUserId) {
      toast.error("先にTwitch Usernameを保存してください")
      return
    }

    setIsCreatingWebhook(true)
    try {
      const result = await createTwitchEventSubSubscription(twitchUserId)

      if (result.success) {
        toast.success("Webhook登録に成功しました")
        setIsSubscribed(true)
      } else {
        toast.error(result.error || "Webhook登録に失敗しました")
      }
    } catch {
      toast.error("予期しないエラーが発生しました")
    } finally {
      setIsCreatingWebhook(false)
    }
  }

  const handleDeleteWebhook = async () => {
    setIsDeletingWebhook(true)
    try {
      const result = await deleteTwitchEventSubSubscription()

      if (result.success) {
        toast.success("Webhook登録を解除しました")
        setIsSubscribed(false)
      } else {
        toast.error(result.error || "Webhook解除に失敗しました")
      }
    } catch {
      toast.error("予期しないエラーが発生しました")
    } finally {
      setIsDeletingWebhook(false)
    }
  }

  const handleSavePriority = async () => {
    setIsSavingPriority(true)
    try {
      const result = await updateLivePriority(livePriority)

      if (result.success) {
        toast.success("ライブ配信優先度を保存しました")
      } else {
        toast.error(result.error || "保存に失敗しました")
      }
    } catch {
      toast.error("予期しないエラーが発生しました")
    } finally {
      setIsSavingPriority(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Twitchチャンネル設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TwitchIcon className="h-5 w-5" />
            Twitchチャンネル設定
          </CardTitle>
          <CardDescription>
            TwitchのUsernameを設定してライブ配信を表示できます
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitchUsername">Twitch Username</Label>
            <Input
              id="twitchUsername"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              https://www.twitch.tv/your_username の「your_username」部分
            </p>
          </div>

          <Button onClick={handleSaveChannel} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>

          {/* EventSub Webhook管理 */}
          {twitchUserId && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Webhook通知設定</h4>
                  <p className="text-sm text-muted-foreground">
                    ライブ配信開始/終了の自動通知を受信
                  </p>
                </div>
                {isLoadingSubStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : isSubscribed ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>登録済み</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XCircle className="h-4 w-4" />
                    <span>未登録</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {isSubscribed ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteWebhook}
                    disabled={isDeletingWebhook}
                  >
                    {isDeletingWebhook && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    登録解除
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCreateWebhook}
                    disabled={isCreatingWebhook}
                  >
                    {isCreatingWebhook && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Webhook登録
                  </Button>
                )}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>本番環境のみ対応</AlertTitle>
                <AlertDescription>
                  Webhook機能は公開URLが必要なため、本番環境でのみ動作します
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ライブ配信優先度設定 */}
      <Card>
        <CardHeader>
          <CardTitle>ライブ配信優先度</CardTitle>
          <CardDescription>
            YouTubeとTwitchの両方でライブ配信中の場合、どちらを優先して表示するか設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={livePriority} onValueChange={(value) => setLivePriority(value as "youtube" | "twitch")}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="youtube" id="youtube-priority" />
              <Label htmlFor="youtube-priority" className="cursor-pointer">
                YouTube を優先
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="twitch" id="twitch-priority" />
              <Label htmlFor="twitch-priority" className="cursor-pointer">
                Twitch を優先
              </Label>
            </div>
          </RadioGroup>

          <Button onClick={handleSavePriority} disabled={isSavingPriority}>
            {isSavingPriority && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
