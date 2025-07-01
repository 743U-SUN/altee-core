import Link from "next/link"
import { BaseLayout } from "@/components/layout/BaseLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getUserNavData } from "@/lib/user-data"

export default async function HomePage() {
  const user = await getUserNavData()
  
  return (
    <BaseLayout variant="default" user={user}>
      <div className="flex flex-col gap-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome to Altee Core
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Next.js 15 + shadcn/ui + Prisma を使用したモダンなウェブアプリ
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 デプロイメント
              </CardTitle>
              <CardDescription>
                GitHub Actions自動デプロイ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Docker環境構築完了
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Nginx + SSL証明書設定完了
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  GitHub Actions自動デプロイ完了
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎨 レイアウトシステム
              </CardTitle>
              <CardDescription>
                BaseLayoutコンポーネント
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  バリアントシステム対応
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  サイドバーカスタマイズ
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  ヘッダーユーザーメニュー
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗄️ データベース
              </CardTitle>
              <CardDescription>
                Prisma + PostgreSQL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  User + Post モデル
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Product モデル追加
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  マイグレーション完了
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/dashboard">
              ダッシュボードを見る
            </Link>
          </Button>
        </div>

        {/* Development Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>開発情報</CardTitle>
            <CardDescription>
              このプロジェクトで使用している技術スタック
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">フロントエンド</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Next.js 15.3.3 (App Router)</li>
                  <li>• React 19</li>
                  <li>• TypeScript</li>
                  <li>• TailwindCSS v4</li>
                  <li>• shadcn/ui + Radix UI</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">バックエンド</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Prisma ORM</li>
                  <li>• PostgreSQL 17.4</li>
                  <li>• Server Actions</li>
                  <li>• Docker環境</li>
                  <li>• さくらVPS + Nginx</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BaseLayout>
  )
}
