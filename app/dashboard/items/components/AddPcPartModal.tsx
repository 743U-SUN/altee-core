'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Image from 'next/image'
import { Loader2, Search, Package } from 'lucide-react'
import { toast } from 'sonner'
import { addPcBuildPart } from '@/app/actions/content/pc-build-actions'
import { pcPartSchema } from '@/lib/validations/pc-build'
import type { PcPartInput } from '@/lib/validations/pc-build'
import type { UserPcBuildPart } from '@prisma/client'
import type { ItemWithPcPartSpec } from '@/types/pc-part-spec'
import { useCatalogSearch } from '@/hooks/use-catalog-search'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { PcPartFormFields } from './PcPartFormFields'
import { useState } from 'react'

interface AddPcPartModalProps {
  isOpen: boolean
  onClose: () => void
  onPartAdded: (part: UserPcBuildPart) => void
}

export function AddPcPartModal({ isOpen, onClose, onPartAdded }: AddPcPartModalProps) {
  const [isSubmitting, startSubmit] = useTransition()
  const [tab, setTab] = useState<string>('manual')
  const [selectedItem, setSelectedItem] = useState<ItemWithPcPartSpec | null>(null)
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
      partType: 'CPU',
      name: '',
      price: undefined,
      amazonUrl: '',
      memo: '',
      itemId: undefined,
    },
  })

  const handleSelectItemWithPcPartSpec = (item: ItemWithPcPartSpec) => {
    setSelectedItem(item)
    const partType = item.pcPartSpec?.partType ?? 'OTHER'
    form.setValue('name', item.name)
    form.setValue('partType', partType)
    form.setValue('itemId', item.id)
    if (item.amazonUrl) {
      form.setValue('amazonUrl', item.amazonUrl)
    }
    setTab('manual') // フォームに切り替えて確認・送信
  }

  const onSubmit = (data: PcPartInput) => {
    startSubmit(async () => {
      try {
        const result = await addPcBuildPart(data)
        if (result.success && result.data) {
          toast.success('パーツを追加しました')
          onPartAdded(result.data)
          form.reset()
          setSelectedItem(null)
          clearSearch()
          onClose()
        } else {
          toast.error(result.error ?? 'パーツの追加に失敗しました')
        }
      } catch {
        toast.error('パーツの追加に失敗しました')
      }
    })
  }

  const handleClose = () => {
    setSelectedItem(null)
    clearSearch()
    setTab('manual')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>パーツを追加</DialogTitle>
          <DialogDescription>
            PCビルドにパーツを追加します
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">手動入力</TabsTrigger>
            <TabsTrigger value="catalog">カタログから選択</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="パーツ名やブランドで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
              />
              <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    onClick={() => handleSelectItemWithPcPartSpec(item)}
                  >
                    <div className="flex items-center gap-3">
                      {item.imageStorageKey ? (
                        <Image
                          src={getPublicUrl(item.imageStorageKey)}
                          alt={item.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.brand?.name && `${item.brand.name} / `}
                          {item.category.name}
                          {item.pcPartSpec?.partType && ` (${item.pcPartSpec.partType})`}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery && !isSearching ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                該当するパーツが見つかりませんでした
              </p>
            ) : null}
          </TabsContent>

          <TabsContent value="manual">
            {selectedItem && (
              <div className="mb-4 p-3 rounded-lg bg-accent/50 border">
                <Label className="text-xs text-muted-foreground">カタログから選択済み</Label>
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-7 text-xs"
                  onClick={() => {
                    setSelectedItem(null)
                    form.setValue('itemId', undefined)
                  }}
                >
                  選択を解除
                </Button>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <PcPartFormFields control={form.control} />

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    キャンセル
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    追加
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
