'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Plus, Trash2 } from 'lucide-react'
import { pcPartTypeLabels } from '@/lib/validations/pc-build'
import { partTypeIcons } from '@/constants/pc-build'
import type { GuestPcPart } from '@/hooks/useGuestPcBuild'

interface PartsListCardProps {
  parts: GuestPcPart[]
  totalPrice: number
  onAddClick: () => void
  onRemovePart: (id: string) => void
}

export function PartsListCard({ parts, totalPrice, onAddClick, onRemovePart }: PartsListCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">パーツ構成</CardTitle>
        <div className="flex items-center gap-2">
          {totalPrice > 0 && (
            <Badge variant="secondary" className="text-sm">
              合計: ¥{totalPrice.toLocaleString()}
            </Badge>
          )}
          <Button size="sm" onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {parts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>パーツがまだ追加されていません</p>
            <p className="text-sm mt-1">「追加」ボタンからパーツを追加してください</p>
          </div>
        ) : (
          <div className="divide-y">
            {parts.map((part) => (
              <div key={part.id} className="flex items-center gap-3 py-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  {partTypeIcons[part.partType]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {pcPartTypeLabels[part.partType]}
                  </p>
                  <p className="font-medium text-sm truncate">{part.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  {part.specs && (
                    <Badge variant="outline" className="text-xs">
                      スペック有
                    </Badge>
                  )}
                  {part.price != null && (
                    <span className="text-sm font-medium whitespace-nowrap">
                      ¥{part.price.toLocaleString()}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onRemovePart(part.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
