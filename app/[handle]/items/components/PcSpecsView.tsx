import Image from 'next/image'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PcPartsList } from './PcPartsList'
import type { SerializedPcBuildWithParts } from '@/types/pc-build'

interface PcSpecsViewProps {
  pcBuild: SerializedPcBuildWithParts | null
  userName: string
}

export function PcSpecsView({ pcBuild, userName }: PcSpecsViewProps) {
  if (!pcBuild) {
    return (
      <div className="text-center py-12">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-muted-foreground">
            PC Specs未設定
          </h3>
          <p className="text-sm text-muted-foreground">
            {userName}さんはまだPCスペック情報を公開していません
          </p>
        </div>
      </div>
    )
  }

  const totalPrice = pcBuild.parts
    .filter((p) => p.price != null)
    .reduce((sum, p) => sum + (p.price ?? 0), 0)

  const displayBudget = pcBuild.totalBudget ?? (totalPrice > 0 ? totalPrice : null)

  return (
    <div className="space-y-6">
      {/* PCビルドヘッダーカード */}
      {(pcBuild.name || pcBuild.imageKey || pcBuild.description || displayBudget) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 items-start">
              {pcBuild.imageKey && (
                <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={getPublicUrl(pcBuild.imageKey)}
                    alt={pcBuild.name ?? 'PC Build'}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {pcBuild.name && (
                  <h2 className="text-xl font-bold">{pcBuild.name}</h2>
                )}
                {displayBudget != null && (
                  <p className="text-sm font-semibold text-muted-foreground mt-1">
                    合計: ¥{displayBudget.toLocaleString('ja-JP')}
                  </p>
                )}
                {pcBuild.description && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {pcBuild.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* パーツリスト */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">システム構成</CardTitle>
        </CardHeader>
        <CardContent>
          <PcPartsList parts={pcBuild.parts} />
        </CardContent>
      </Card>
    </div>
  )
}
