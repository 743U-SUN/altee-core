import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DeviceCard } from './DeviceCard'
import { DeviceFilters } from './DeviceFilters'
import { DeviceCategory } from '@prisma/client'
import { DeviceWithDetails } from '@/types/device'

interface DeviceListSectionProps {
  devices: DeviceWithDetails[]
  categories: DeviceCategory[]
  brands: { id: string, name: string }[]
  initialFilters: {
    category?: string
    brand?: string
    search?: string
  }
}

export function DeviceListSection({ 
  devices, 
  categories, 
  brands,
  initialFilters 
}: DeviceListSectionProps) {

  return (
    <div className="space-y-6">
      {/* 検索・フィルタエリア */}
      <DeviceFilters
        categories={categories}
        brands={brands}
        initialFilters={initialFilters}
      />

      {/* 結果表示 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {devices.length}件のデバイスが見つかりました
          </p>
        </div>

        {devices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">条件に合うデバイスが見つかりませんでした</p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/devices">フィルタをリセット</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard 
                key={device.id} 
                device={device}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}