import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Bell, Mail, Settings, ExternalLink } from "lucide-react"

export default function NotificationsDemo() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">通知機能デモページ</h1>
        <p className="text-muted-foreground">
          通知・連絡方法機能のテストと確認を行うページです
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* 機能説明 */}
          <Card>
            <CardHeader>
              <CardTitle>実装完了機能</CardTitle>
              <CardDescription>
                以下の機能が実装されました
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <div>
                    <h4 className="font-medium">お知らせ機能</h4>
                    <p className="text-sm text-muted-foreground">
                      ベルアイコンで通知表示、未読時は赤いドット表示
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium">連絡方法機能</h4>
                    <p className="text-sm text-muted-foreground">
                      メールアイコンで連絡方法表示
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium">Dashboard設定</h4>
                    <p className="text-sm text-muted-foreground">
                      画像アップロード、フォーム機能完備
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* テスト手順 */}
          <Card>
            <CardHeader>
              <CardTitle>テスト手順</CardTitle>
              <CardDescription>
                以下の手順でテストを行ってください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <h4 className="font-medium">Dashboard設定</h4>
                    <p className="text-sm text-muted-foreground">
                      /dashboard/notifications で通知・連絡方法を設定
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/dashboard/notifications">
                        設定ページへ移動
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <h4 className="font-medium">プロフィールページ確認</h4>
                    <p className="text-sm text-muted-foreground">
                      ユーザープロフィールページでアイコンが表示されることを確認
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ※ handleが設定されているユーザーの場合: /[handle]
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <h4 className="font-medium">モーダル機能確認</h4>
                    <p className="text-sm text-muted-foreground">
                      アイコンクリックでモーダルが開き、画像・タイトル・内容が表示されることを確認
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div>
                    <h4 className="font-medium">既読機能確認</h4>
                    <p className="text-sm text-muted-foreground">
                      通知の赤いドット表示・非表示が正常に動作することを確認
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    5
                  </div>
                  <div>
                    <h4 className="font-medium">リンク機能確認</h4>
                    <p className="text-sm text-muted-foreground">
                      ボタンクリックで新しいタブでリンクが開くことを確認
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 技術仕様 */}
          <Card>
            <CardHeader>
              <CardTitle>技術仕様</CardTitle>
              <CardDescription>
                実装された技術的な詳細
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 text-sm">
                <div>
                  <h4 className="font-medium">データベース</h4>
                  <p className="text-muted-foreground">
                    UserNotifications, UserContacts テーブル（1対1リレーション）
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">画像管理</h4>
                  <p className="text-muted-foreground">
                    専用コンテナ: user-notifications, user-contacts
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">既読管理</h4>
                  <p className="text-muted-foreground">
                    Cookie使用（30日有効）: notification_read_[userId]
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">パフォーマンス</h4>
                  <p className="text-muted-foreground">
                    Dynamic import、遅延読み込み対応
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">バリデーション</h4>
                  <p className="text-muted-foreground">
                    タイトル30文字、内容1000文字、https形式チェック
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}