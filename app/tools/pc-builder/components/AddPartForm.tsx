'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { searchPcPartCatalog } from '@/app/actions/content/pc-build-actions'
import { PC_PART_TYPES, pcPartTypeLabels } from '@/lib/validations/pc-build'
import type { PcPartType } from '@prisma/client'
import type { ItemWithPcPartSpec } from '@/types/pc-part-spec'
import type { GuestPcPart } from '@/hooks/useGuestPcBuild'

interface AddPartFormProps {
  onAddPart: (part: Omit<GuestPcPart, 'id'>) => void
  onClose: () => void
}

export function AddPartForm({ onAddPart, onClose }: AddPartFormProps) {
  const [newPartType, setNewPartType] = useState<PcPartType>('CPU')
  const [newPartName, setNewPartName] = useState('')
  const [newPartPrice, setNewPartPrice] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ItemWithPcPartSpec[]>([])
  const [isSearching, startSearchTransition] = useTransition()

  const handleSearch = () => {
    if (!searchQuery.trim()) return
    startSearchTransition(async () => {
      try {
        const result = await searchPcPartCatalog(searchQuery, newPartType)
        if (result.success && result.data) {
          setSearchResults(result.data as ItemWithPcPartSpec[])
        }
      } catch {
        toast.error('検索に失敗しました')
      }
    })
  }

  const handleSelectCatalog = (item: ItemWithPcPartSpec) => {
    onAddPart({
      partType: item.pcPartSpec?.partType ?? newPartType,
      name: item.name,
      itemId: item.id,
      specs: item.pcPartSpec?.specs as Record<string, unknown> | null,
      tdp: item.pcPartSpec?.tdp,
    })
    setSearchResults([])
    setSearchQuery('')
    onClose()
    toast.success('パーツを追加しました')
  }

  const handleManualAdd = () => {
    if (!newPartName.trim()) {
      toast.error('パーツ名を入力してください')
      return
    }
    onAddPart({
      partType: newPartType,
      name: newPartName,
      price: newPartPrice ? Number(newPartPrice) : null,
    })
    setNewPartName('')
    setNewPartPrice('')
    onClose()
    toast.success('パーツを追加しました')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">パーツを追加</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>パーツ種別</Label>
            <Select value={newPartType} onValueChange={(v) => setNewPartType(v as PcPartType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PC_PART_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {pcPartTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* カタログ検索 */}
        <div className="space-y-2">
          <Label>カタログから検索</Label>
          <div className="flex gap-2">
            <Input
              placeholder="パーツ名やブランドで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch()
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleSearch} disabled={isSearching}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto border rounded-lg p-2">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors text-sm"
                  onClick={() => handleSelectCatalog(item)}
                >
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.brand?.name && `${item.brand.name} / `}
                    {item.category.name}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 手動入力 */}
        <div className="space-y-2 border-t pt-4">
          <Label>または手動で入力</Label>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="パーツ名"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
            />
            <Input
              type="number"
              placeholder="価格（円）"
              value={newPartPrice}
              onChange={(e) => setNewPartPrice(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleManualAdd}>追加</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
