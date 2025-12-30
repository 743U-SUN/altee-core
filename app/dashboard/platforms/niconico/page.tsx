import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function NiconicoPlatformPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ニコニコ動画統合</CardTitle>
          <CardDescription>
            ニコニコ動画プラットフォームとの統合機能は現在開発中です
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            将来のアップデートで利用可能になります
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
