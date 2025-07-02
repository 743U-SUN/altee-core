import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceForm } from '../components/DeviceForm'

export default function NewDevicePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild className="w-fit">
          <Link href="/admin/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新規デバイス登録</h1>
          <p className="text-muted-foreground">
            Amazon商品URLを使用してデバイスを登録します
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>デバイス情報</CardTitle>
          <CardDescription>
            Amazon商品URLを入力すると、商品情報を自動取得します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceForm />
        </CardContent>
      </Card>
    </div>
  )
}