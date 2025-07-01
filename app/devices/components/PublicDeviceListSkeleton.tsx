import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PublicDeviceListSkeleton() {
  return (
    <div className="space-y-6">
      {/* 検索・フィルタエリア */}
      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-12" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>

      {/* デバイス一覧 */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Skeleton className="w-20 h-20 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }, (_, j) => (
                    <Skeleton key={j} className="h-3 w-3" />
                  ))}
                  <Skeleton className="h-3 w-8 ml-1" />
                </div>

                <div className="space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>

                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}