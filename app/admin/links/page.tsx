import type { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { LinkTypeTable } from './components/LinkTypeTable'

export const metadata: Metadata = {
  title: 'リンク管理 | Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLinksPage() {
  const session = await auth()

  // 3層認証アーキテクチャ：Page層での最終権限チェック
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">リンク管理</h1>
        <p className="text-muted-foreground">
          SNSリンクタイプとアイコンの管理、使用統計の確認ができます
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <LinkTypeTable />
        </CardContent>
      </Card>
    </div>
  )
}