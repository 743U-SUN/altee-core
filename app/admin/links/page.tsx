import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { LinkTypeTable } from './components/LinkTypeTable'

export const metadata: Metadata = {
  title: 'リンク管理 | Admin',
  robots: { index: false, follow: false },
}

export default async function AdminLinksPage() {
  await requireAdmin()

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