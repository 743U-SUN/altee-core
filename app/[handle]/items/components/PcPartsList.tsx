import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { pcPartTypeLabels } from '@/lib/validations/pc-build'
import { partTypeIconComponents } from '@/constants/pc-build'
import type { PcBuildPartWithItem } from '@/types/pc-build'

interface PcPartsListProps {
  parts: PcBuildPartWithItem[]
}

export function PcPartsList({ parts }: PcPartsListProps) {
  if (parts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        パーツ情報がありません
      </div>
    )
  }

  return (
    <div className="divide-y">
      {parts.map((part) => {
        const item = part.item
        const imageUrl = item?.imageStorageKey
          ? getPublicUrl(item.imageStorageKey)
          : null
        const amazonUrl = part.amazonUrl || item?.amazonUrl

        const PartIcon = partTypeIconComponents[part.partType]
        return (
          <div key={part.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
            {/* アイコンまたは画像 */}
            {imageUrl ? (
              <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden bg-muted">
                <Image
                  src={imageUrl}
                  alt={part.name}
                  width={40}
                  height={40}
                  sizes="40px"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <PartIcon className="w-4 h-4" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {pcPartTypeLabels[part.partType] ?? part.partType}
                  </p>
                  <p className="font-medium truncate">{part.name}</p>
                  {item?.brand && (
                    <p className="text-xs text-muted-foreground">{item.brand.name}</p>
                  )}
                  {part.memo && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{part.memo}</p>
                  )}
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {part.price != null && (
                    <span className="text-sm font-semibold whitespace-nowrap">
                      ¥{part.price.toLocaleString('ja-JP')}
                    </span>
                  )}
                  {amazonUrl && (
                    <Link
                      href={amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
