import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { MediaUploadForm } from './components/MediaUploadForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MediaUploadPage() {
  const session = await auth()

  // 3層認証アーキテクチャ：Page層での最終権限チェック
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

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