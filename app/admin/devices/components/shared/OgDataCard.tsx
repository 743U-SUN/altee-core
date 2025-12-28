import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeviceImage } from '@/components/devices/device-image'
import type { AmazonOgData } from '@/types/device'

interface OgDataCardProps {
  ogData: AmazonOgData | null
  asin?: string
  showAsin?: boolean
}

export function OgDataCard({ ogData, asin, showAsin = true }: OgDataCardProps) {
  if (!ogData || (!ogData.title && !ogData.image)) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          {showAsin ? '取得した商品情報' : '商品情報'}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex space-x-4">
        {ogData.image && (
          <DeviceImage
            amazonImageUrl={ogData.image}
            alt={ogData.title || 'デバイス画像'}
            width={100}
            height={100}
            className="flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium">{ogData.title}</h4>
          {ogData.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {ogData.description}
            </p>
          )}
          {showAsin && asin && (
            <p className="text-xs text-muted-foreground mt-2">
              ASIN: {asin}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
