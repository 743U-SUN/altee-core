'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { Loader2, Search, Package } from 'lucide-react'
import { toast } from 'sonner'
import { updatePcBuildPart } from '@/app/actions/content/pc-build-actions'
import { pcPartSchema } from '@/lib/validations/pc-build'
import type { PcPartInput } from '@/lib/validations/pc-build'
import type { UserPcBuildPart } from '@prisma/client'
import type { ItemWithPcPartSpec } from '@/types/pc-part-spec'
import { useCatalogSearch } from '@/hooks/useCatalogSearch'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { PcPartFormFields } from './PcPartFormFields'

interface EditPcPartModalProps {
  isOpen: boolean
  onClose: () => void
  part: UserPcBuildPart
  onPartUpdated: (part: UserPcBuildPart) => void
}

export function EditPcPartModal({ isOpen, onClose, part, onPartUpdated }: EditPcPartModalProps) {
  const [isSubmitting, startSubmit] = useTransition()
  const [linkedItemId, setLinkedItemId] = useState<string | null>(part.itemId)
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    handleSearch,
    clearSearch,
  } = useCatalogSearch()

  const form = useForm<PcPartInput>({
    resolver: zodResolver(pcPartSchema),
    defaultValues: {
      partType: part.partType,
      name: part.name,
      price: part.price ?? undefined,
      amazonUrl: part.amazonUrl ?? '',
      memo: part.memo ?? '',
      itemId: part.itemId ?? undefined,
    },
  })

  const handleSelectItemWithPcPartSpec = (item: ItemWithPcPartSpec) => {
    setLinkedItemId(item.id)
    form.setValue('name', item.name)
    form.setValue('itemId', item.id)
    if (item.amazonUrl) {
      form.setValue('amazonUrl', item.amazonUrl)
    }
    if (item.pcPartSpec?.partType) {
      form.setValue('partType', item.pcPartSpec.partType)
    }
    clearSearch()
  }

  const onSubmit = (data: PcPartInput) => {
    startSubmit(async () => {
      try {
        const result = await updatePcBuildPart(part.id, data)
        if (result.success && result.data) {
          toast.success('パーツを更新しました')
          onPartUpdated(result.data)
          onClose()
        } else {
          toast.error(result.error ?? 'パーツの更新に失敗しました')
        }
      } catch {
        toast.error('パーツの更新に失敗しました')
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>パーツを編集</DialogTitle>
          <DialogDescription>
            パーツ情報を編集します
          </DialogDescription>
        </DialogHeader>

        {/* カタログ検索（インライン） */}
        <div className="space-y-2 rounded-lg border p-3">
          <Label className="text-sm font-medium">カタログから選択（オプション）</Label>
          <div className="flex gap-2">
            <Input
              placeholder="パーツ名やブランドで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left p-2 rounded border hover:bg-accent transition-colors text-sm"
                  onClick={() => handleSelectItemWithPcPartSpec(item)}
                >
                  <div className="flex items-center gap-2">
                    {item.imageStorageKey ? (
                      <Image
                        src={getPublicUrl(item.imageStorageKey)}
                        alt={item.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 object-contain rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.brand?.name && `${item.brand.name}`}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {linkedItemId && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>カタログアイテムにリンク済み</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  setLinkedItemId(null)
                  form.setValue('itemId', undefined)
                }}
              >
                リンク解除
              </Button>
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PcPartFormFields control={form.control} />

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                更新
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
