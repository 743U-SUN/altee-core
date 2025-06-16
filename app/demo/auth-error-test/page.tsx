import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const errorTypes = [
  { code: "AccessDenied", description: "アクセス拒否（ブラックリスト等）" },
  { code: "OAuthAccountNotLinked", description: "メール重複、プロバイダー未連携" },
  { code: "Configuration", description: "OAuth設定エラー" },
  { code: "Verification", description: "アカウント確認エラー" }, 
  { code: "OAuthCallback", description: "OAuth認証コールバックエラー" },
  { code: "OAuthCreateAccount", description: "OAuthアカウント作成エラー" },
  { code: "EmailCreateAccount", description: "メールアカウント作成エラー" },
  { code: "Callback", description: "一般認証コールバックエラー" },
  { code: "SessionRequired", description: "セッション必須エラー" },
  { code: "Default", description: "予期しないエラー" }
]

export default function AuthErrorTestPage() {
  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>認証エラーページテスト</CardTitle>
          <CardDescription>
            各エラータイプのエラーページ表示をテストできます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {errorTypes.map((errorType) => (
              <Button
                key={errorType.code}
                variant="outline"
                asChild
                className="h-auto p-4 text-left justify-start"
              >
                <Link href={`/auth/error?error=${errorType.code}`}>
                  <div>
                    <div className="font-semibold text-sm">{errorType.code}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {errorType.description}
                    </div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">実際のエラー発生方法</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <p><strong>AccessDenied:</strong> ブラックリストに登録されたメールでログイン</p>
              <p><strong>Configuration:</strong> 環境変数GOOGLE_CLIENT_IDを無効な値に設定</p>
              <p><strong>OAuthAccountNotLinked:</strong> allowDangerousEmailAccountLinking=falseで異なるプロバイダー使用</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button variant="secondary" asChild>
              <Link href="/demo/auth-test">
                認証テストページに戻る
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}