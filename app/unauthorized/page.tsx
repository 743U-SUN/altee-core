import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldX } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: 'アクセス権限がありません',
  robots: { index: false, follow: false },
}

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-2xl">アクセス権限がありません</CardTitle>
          <CardDescription>
            このページにアクセスするための権限がありません
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="text-muted-foreground">
              このページは特定のユーザーのみアクセス可能です。
              アクセス権限が必要な場合は管理者にお問い合わせください。
            </p>
          </div>

          <Button asChild className="w-full" variant="ghost">
            <Link href="/">
              トップページに戻る
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
