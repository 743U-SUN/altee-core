import type { Metadata } from 'next'
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { UserCircle, Bell, Tv } from "lucide-react"
import { SetupChecker } from "./setup-checker"

export const metadata: Metadata = {
  title: 'ダッシュボード',
}

const settingsItems = [
  {
    title: "プロフィールエディター",
    description: "プロフィール・テーマ・セクションの編集",
    href: "/dashboard/profile-editor",
    icon: UserCircle,
  },
  {
    title: "プラットフォーム連携",
    description: "Twitch・YouTubeとの連携設定",
    href: "/dashboard/platforms",
    icon: Tv,
  },
  {
    title: "通知・連絡方法設定",
    description: "お知らせと連絡方法の設定",
    href: "/dashboard/notifications",
    icon: Bell,
  },
]

export default function DashboardPage() {
  return (
    <SetupChecker>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground">各種設定を管理できます</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {settingsItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <Card className="h-full transition-colors hover:bg-accent hover:text-accent-foreground">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </SetupChecker>
  )
}