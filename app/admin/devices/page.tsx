import { Suspense } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceList } from './components/DeviceList'

export default function AdminDevicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">デバイス管理</h1>
          <p className="text-muted-foreground">
            Amazon商品URLから登録されたデバイスを管理できます
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/devices/new">
            <Plus className="mr-2 h-4 w-4" />
            新規デバイス登録
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>デバイス一覧</CardTitle>
          <CardDescription>
            登録されているデバイスを一覧で確認できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          }>
            <DeviceList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}