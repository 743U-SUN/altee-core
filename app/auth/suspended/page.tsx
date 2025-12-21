import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Mail } from "lucide-react"
import Link from "next/link"

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">アカウントが停止されています</CardTitle>
          <CardDescription>
            あなたのアカウントは管理者によって一時停止されました
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="text-muted-foreground">
              このアカウントは現在ログインできない状態です。
              アカウントの状態について詳しく知りたい場合は、サポートチームまでお問い合わせください。
            </p>
          </div>

          <div className="space-y-2">
            <Button asChild className="w-full" variant="outline">
              <Link href="mailto:support@example.com">
                <Mail className="h-4 w-4 mr-2" />
                サポートに問い合わせる
              </Link>
            </Button>

            <Button asChild className="w-full" variant="ghost">
              <Link href="/">
                トップページに戻る
              </Link>
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            アカウントの復旧が可能な場合、サポートチームから連絡いたします。
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
