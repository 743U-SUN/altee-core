import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { User, UserCircle, Share2, Smartphone, HelpCircle } from "lucide-react"

const settingsItems = [
  {
    title: "基本情報設定",
    description: "アカウントの基本情報を管理",
    href: "/dashboard/account",
    icon: User,
  },
  {
    title: "プロフィール設定",
    description: "公開プロフィールの編集",
    href: "/dashboard/profile",
    icon: UserCircle,
  },
  {
    title: "SNSリンク設定",
    description: "ソーシャルメディアのリンクを管理",
    href: "/dashboard/links",
    icon: Share2,
  },
  {
    title: "デバイス設定",
    description: "接続されたデバイスの管理",
    href: "/dashboard/device",
    icon: Smartphone,
  },
  {
    title: "FAQ設定",
    description: "よくある質問の設定",
    href: "/dashboard/faq",
    icon: HelpCircle,
  },
]

export default function DashboardPage() {
  return (
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
  )
}