import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

type ErrorCode = 
  | "Configuration" 
  | "AccessDenied" 
  | "Verification" 
  | "Default"
  | "OAuthAccountNotLinked"
  | "OAuthCreateAccount"
  | "EmailCreateAccount"
  | "Callback"
  | "OAuthCallback"
  | "SessionRequired"

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string
  }>
}

const errorMessages: Record<ErrorCode, { title: string; description: string; canRetry: boolean }> = {
  Configuration: {
    title: "設定エラー",
    description: "認証サービスの設定に問題があります。管理者にお問い合わせください。",
    canRetry: false
  },
  AccessDenied: {
    title: "アクセス拒否",
    description: "このアカウントでのアクセスは許可されていません。別のアカウントでお試しください。",
    canRetry: true
  },
  Verification: {
    title: "確認エラー",
    description: "アカウントの確認に失敗しました。もう一度お試しください。",
    canRetry: true
  },
  OAuthAccountNotLinked: {
    title: "アカウント連携エラー",
    description: "このメールアドレスは既に別のプロバイダーで使用されています。最初に使用したプロバイダーでログインしてください。",
    canRetry: true
  },
  OAuthCreateAccount: {
    title: "アカウント作成エラー",
    description: "OAuthアカウントの作成中にエラーが発生しました。もう一度お試しください。",
    canRetry: true
  },
  EmailCreateAccount: {
    title: "メールアカウント作成エラー",
    description: "メールアカウントの作成中にエラーが発生しました。もう一度お試しください。",
    canRetry: true
  },
  Callback: {
    title: "認証コールバックエラー",
    description: "認証プロセス中にエラーが発生しました。もう一度お試しください。",
    canRetry: true
  },
  OAuthCallback: {
    title: "OAuth認証エラー",
    description: "OAuth認証プロセス中にエラーが発生しました。もう一度お試しください。",
    canRetry: true
  },
  SessionRequired: {
    title: "セッション必須",
    description: "このページにアクセスするにはログインが必要です。",
    canRetry: true
  },
  Default: {
    title: "認証エラー",
    description: "認証中に予期しないエラーが発生しました。もう一度お試しください。",
    canRetry: true
  }
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams
  const errorCode = (params.error as ErrorCode) || "Default"
  const errorInfo = errorMessages[errorCode] || errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-gray-600">
            サインイン中にエラーが発生しました
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {errorInfo.description}
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {errorInfo.canRetry && (
              <Button asChild className="w-full">
                <Link href="/auth/signin">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  もう一度試す
                </Link>
              </Button>
            )}
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                ホームに戻る
              </Link>
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>問題が解決しない場合：</p>
            <div className="space-y-1">
              <Link 
                href="/demo/auth-test" 
                className="block text-blue-600 hover:underline"
              >
                認証テストページで詳細確認
              </Link>
              <p className="text-gray-500">
                エラーコード: <code className="bg-gray-100 px-1 rounded text-xs">{errorCode}</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}