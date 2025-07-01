import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Eye } from "lucide-react"
import { DeviceImage } from "@/components/devices/device-image"
import { DeviceWithDetails } from '@/types/device'
import { AmazonLinkButton } from './AmazonLinkButton'

interface DeviceCardProps {
  device: DeviceWithDetails
}

export function DeviceCard({ device }: DeviceCardProps) {
  const userCount = device.userDevices.length

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {device.category.name}
            </Badge>
            {device.brand && (
              <Badge variant="secondary" className="text-xs">
                {device.brand.name}
              </Badge>
            )}
          </div>
          <AmazonLinkButton amazonUrl={device.amazonUrl} />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex items-start space-x-3">
          <DeviceImage
            src={device.amazonImageUrl}
            alt={device.name}
            width={80}
            height={80}
            className="w-20 h-20 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-tight line-clamp-2">
              {device.name}
            </h3>
            <div className="text-xs text-muted-foreground mt-1">
              ASIN: {device.asin}
            </div>
          </div>
        </div>


        {/* 説明文 */}
        {device.description && (
          <div className="flex-1">
            <p className="text-xs text-muted-foreground line-clamp-3">
              {device.description}
            </p>
          </div>
        )}

        {/* 属性情報 */}
        {device.attributes.length > 0 && (
          <div className="space-y-1">
            {device.attributes.slice(0, 3).map((attr) => (
              <div key={attr.id} className="text-xs">
                <span className="text-muted-foreground">
                  {attr.categoryAttribute.name}:
                </span>
                <span className="ml-1 font-medium">
                  {attr.value}
                  {attr.categoryAttribute.unit && ` ${attr.categoryAttribute.unit}`}
                </span>
              </div>
            ))}
            {device.attributes.length > 3 && (
              <div className="text-xs text-muted-foreground">
                他 {device.attributes.length - 3} 項目
              </div>
            )}
          </div>
        )}

        {/* ユーザー統計 */}
        <div className="pt-3 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {userCount}人が使用中
              </span>
            </div>
            {userCount > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-primary hover:underline cursor-pointer">
                  レビューを見る
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}