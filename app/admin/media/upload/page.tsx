import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { MediaUploadForm } from './components/MediaUploadForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'メディアアップロード',
  robots: { index: false, follow: false },
}

export default async function MediaUploadPage() {
  await requireAdmin()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">メディアアップロード</h1>
          <p className="text-muted-foreground">
            画像ファイルをアップロードして、記事やシステムで利用できるようにします
          </p>
        </div>
        <Link href="/admin/media">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            メディア管理に戻る
          </Button>
        </Link>
      </div>

      {/* アップロードフォーム */}
      <MediaUploadForm />
    </div>
  )
}