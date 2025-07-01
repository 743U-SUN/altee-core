import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDevice } from '@/app/actions/device-actions'
import { DeviceEditForm } from '../components/DeviceEditForm'

interface DeviceEditPageProps {
  params: Promise<{ id: string }>
}

export default async function DeviceEditPage({ params }: DeviceEditPageProps) {
  const { id } = await params
  const device = await getDevice(id)

  if (!device) {
    notFound()
  }

  // 既存の属性データをオブジェクト形式に変換
  const existingAttributes = device.attributes.reduce((acc: Record<string, string>, attr: { categoryAttributeId: string; value: string }) => {
    acc[attr.categoryAttributeId] = attr.value
    return acc
  }, {} as { [key: string]: string })

  const initialData = {
    asin: device.asin,
    amazonUrl: device.amazonUrl,
    name: device.name,
    description: device.description || '',
    categoryId: device.categoryId,
    amazonImageUrl: device.amazonImageUrl || undefined,
    ogTitle: device.ogTitle || undefined,
    ogDescription: device.ogDescription || undefined,
    attributes: existingAttributes
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/devices">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">デバイス編集</h1>
          <p className="text-muted-foreground">
            {device.name} の情報を編集します
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>デバイス情報</CardTitle>
          <CardDescription>
            デバイスの基本情報と属性を編集できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DeviceEditForm 
            initialData={initialData} 
            deviceId={device.id}
            asin={device.asin}
          />
        </CardContent>
      </Card>
    </div>
  )
}