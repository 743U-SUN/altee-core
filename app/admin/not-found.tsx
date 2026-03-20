import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="container mx-auto p-6 text-center space-y-4">
      <h2 className="text-2xl font-bold">404 - ページが見つかりません</h2>
      <p className="text-muted-foreground">
        お探しのページは存在しないか、削除された可能性があります。
      </p>
      <Button asChild>
        <Link href="/admin">管理画面トップへ戻る</Link>
      </Button>
    </div>
  )
}
