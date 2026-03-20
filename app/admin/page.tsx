import type { Metadata } from 'next'
import Link from "next/link"

export const metadata: Metadata = {
  title: '管理画面',
  robots: { index: false, follow: false },
}

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold">管理者ダッシュボード</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
          <h3 className="font-semibold mb-2">ユーザー管理</h3>
          <p className="text-sm text-muted-foreground">システムユーザーの管理と設定</p>
        </Link>
        
        <Link href="/admin/links" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
          <h3 className="font-semibold mb-2">リンク管理</h3>
          <p className="text-sm text-muted-foreground">SNSリンクタイプとアイコンの管理</p>
        </Link>

        <Link href="/admin/managed-profiles" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
          <h3 className="font-semibold mb-2">公式プロフィール管理</h3>
          <p className="text-sm text-muted-foreground">MANAGED VTuberプロフィールの作成と管理</p>
        </Link>

        <Link href="/admin/items" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
          <h3 className="font-semibold mb-2">デバイス管理</h3>
          <p className="text-sm text-muted-foreground">登録デバイスの管理と編集</p>
        </Link>

        <Link href="/admin/articles" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
          <h3 className="font-semibold mb-2">記事管理</h3>
          <p className="text-sm text-muted-foreground">ブログ記事の作成と管理</p>
        </Link>

        <Link href="/admin/media" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
          <h3 className="font-semibold mb-2">メディア管理</h3>
          <p className="text-sm text-muted-foreground">画像ファイルの管理と統計</p>
        </Link>

        <Link href="/admin/section-backgrounds" className="bg-card text-card-foreground p-6 rounded-lg border hover:bg-accent transition-colors">
          <h3 className="font-semibold mb-2">背景プリセット</h3>
          <p className="text-sm text-muted-foreground">セクション背景プリセットの管理</p>
        </Link>

        <div className="bg-card text-card-foreground p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">システム設定</h3>
          <p className="text-sm text-muted-foreground">アプリケーション設定の管理</p>
        </div>
        
        <div className="bg-card text-card-foreground p-6 rounded-lg border">
          <h3 className="font-semibold mb-2">監視・ログ</h3>
          <p className="text-sm text-muted-foreground">システム監視とログ管理</p>
        </div>
      </div>
    </div>
  )
}