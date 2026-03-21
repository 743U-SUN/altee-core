import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserNotification } from "@/app/actions/user/notification-actions"
import { getUserContact } from "@/app/actions/user/contact-actions"
import { cachedAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: '通知・連絡設定',
  robots: { index: false, follow: false },
}
import { NotificationSettings } from "./notification-settings"
import { ContactSettings } from "./contact-settings"
import { Bell, Mail } from "lucide-react"

export default async function NotificationsPage() {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  // 全クエリを並列実行してウォーターフォールを解消
  const [user, notificationResult, contactResult] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profile: { select: { userId: true } } },
    }),
    getUserNotification(),
    getUserContact(),
  ])

  if (!user?.profile) {
    redirect('/dashboard/setup')
  }
  
  if (!notificationResult.success || !contactResult.success) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="w-full max-w-5xl mx-auto">
          <p className="text-destructive">
            データの読み込みに失敗しました
          </p>
        </div>
      </div>
    )
  }

  // Date フィールドをシリアライズしてからクライアントコンポーネントへ渡す
  const notificationRaw = notificationResult.data ?? null
  const notification = notificationRaw
    ? {
        ...notificationRaw,
        createdAt: notificationRaw.createdAt.toISOString(),
        updatedAt: notificationRaw.updatedAt.toISOString(),
      }
    : null

  const contactRaw = contactResult.data ?? null
  const contact = contactRaw
    ? {
        ...contactRaw,
        createdAt: contactRaw.createdAt.toISOString(),
        updatedAt: contactRaw.updatedAt.toISOString(),
      }
    : null

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">通知・連絡方法設定</h1>
        <p className="text-muted-foreground">
          プロフィールページに表示するお知らせと連絡方法を設定します
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto">
        <div className="grid gap-6">
          {/* お知らせ設定 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <CardTitle>お知らせ設定</CardTitle>
              </div>
              <CardDescription>
                重要なお知らせをプロフィール訪問者に伝えることができます。未読時は赤いドットが表示されます。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotificationSettings initialData={notification} />
            </CardContent>
          </Card>

          {/* 連絡方法設定 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <CardTitle>連絡方法設定</CardTitle>
              </div>
              <CardDescription>
                あなたへの連絡方法を設定できます。問い合わせフォームへのリンクやメールアドレスなどを設定してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactSettings initialData={contact} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}