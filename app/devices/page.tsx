import { Suspense } from 'react'
import { Metadata } from 'next'
import { BaseLayout } from "@/components/layout/BaseLayout"
import { getUserNavData } from "@/lib/user-data"
import { getPublicDevices, getDeviceCategories, getBrands } from '@/app/actions/device-actions'
import { DeviceListSection } from './components/DeviceListSection'
import { PublicDeviceListSkeleton } from './components/PublicDeviceListSkeleton'
import { DeviceWithDetails } from '@/types/device'

export const metadata: Metadata = {
  title: 'デバイス一覧 | ALTEE',
  description: 'PC周辺機器・デバイスのデータベース。スペック情報やユーザーレビューを確認できます。',
}

interface PublicDevicesPageProps {
  searchParams: Promise<{
    category?: string
    brand?: string
    search?: string
  }>
}

export default async function PublicDevicesPage({ searchParams }: PublicDevicesPageProps) {
  const resolvedSearchParams = await searchParams
  const user = await getUserNavData()
  
  return (
    <BaseLayout variant="public" user={user}>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">デバイス一覧</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            PC周辺機器・デバイスのデータベース。詳細なスペック情報やユーザーレビューを確認できます。
            気になるデバイスがあれば、実際に使っているユーザーの評価を参考にしてみてください。
          </p>
        </div>

        <Suspense fallback={<PublicDeviceListSkeleton />}>
          <DeviceContent searchParams={resolvedSearchParams} />
        </Suspense>
      </div>
    </BaseLayout>
  )
}

async function DeviceContent({ searchParams }: { 
  searchParams: { category?: string; brand?: string; search?: string } 
}) {
  const [devices, categories, brands] = await Promise.all([
    getPublicDevices(searchParams.category, searchParams.brand, searchParams.search),
    getDeviceCategories(),
    getBrands()
  ])

  return (
    <DeviceListSection
      devices={devices as DeviceWithDetails[]}
      categories={categories}
      brands={brands}
      initialFilters={searchParams}
    />
  )
}