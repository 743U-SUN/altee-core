import Link from 'next/link'
import { Edit, ExternalLink } from 'lucide-react'
import { getDevices } from '@/app/actions/device-actions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeviceImage } from '@/components/devices/device-image'
import { DeleteDeviceButton } from './DeleteDeviceButton'

type DeviceWithCategory = {
  id: string
  asin: string
  name: string
  description: string | null
  amazonUrl: string
  amazonImageUrl: string | null
  category: {
    name: string
  }
  userDevices: { id: string }[]
}

export async function DeviceList() {
  const devices = await getDevices()

  if (devices.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">まだデバイスが登録されていません</p>
        <Button asChild className="mt-4">
          <Link href="/admin/devices/new">最初のデバイスを登録</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {devices.map((device: DeviceWithCategory) => (
        <div
          key={device.id}
          className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
        >
          <DeviceImage
            src={device.amazonImageUrl}
            alt={device.name}
            width={80}
            height={80}
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold truncate">{device.name}</h3>
              <Badge variant="outline">{device.category.name}</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground mb-2">
              ASIN: {device.asin}
            </p>
            
            {device.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {device.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-xs text-muted-foreground">
                使用者: {device.userDevices.length}人
              </span>
              <a
                href={device.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center"
              >
                Amazon
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/devices/${device.id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <DeleteDeviceButton 
              deviceId={device.id} 
              deviceName={device.name}
              hasUsers={device.userDevices.length > 0}
            />
          </div>
        </div>
      ))}
    </div>
  )
}