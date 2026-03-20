import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'

export default function PcPartNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <Package className="h-16 w-16 text-muted-foreground/30" />
      <h2 className="text-xl font-semibold">PCパーツが見つかりません</h2>
      <p className="text-muted-foreground">
        指定されたPCパーツは存在しないか、削除された可能性があります。
      </p>
      <Button asChild>
        <Link href="/items/pc-parts">PCパーツ一覧へ</Link>
      </Button>
    </div>
  )
}
