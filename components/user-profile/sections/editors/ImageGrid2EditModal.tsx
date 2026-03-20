'use client'

import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { PRESET_CONTENT } from '@/lib/image-uploader/image-processing-presets'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useImageGridEditor } from './hooks/useImageGridEditor'
import type { ImageGrid2Data } from '@/types/profile-sections'

interface ImageGrid2EditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: ImageGrid2Data
}

const ITEM_COUNT = 2

export function ImageGrid2EditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: ImageGrid2EditModalProps) {
  const {
    sortedItems,
    isPending,
    updateItem,
    handleMove,
    getUploadValue,
    handleUpload,
    handleDelete,
    handleSave,
  } = useImageGridEditor({
    sectionId,
    initialItems: currentData.items || [],
    itemCount: ITEM_COUNT,
    onClose,
  })

  return (
    <EditModal isOpen={isOpen} onClose={onClose} title="画像グリッド (2列) を編集" hideActions>
      <div className="space-y-4">
        {/* 画像一覧 */}
        <div className="grid grid-cols-2 gap-3">
          {sortedItems.map((item, index) => (
            <div key={item.id} className="relative">
              {/* 画像プレビュー */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted/50 mb-2">
                <ImageUploader
                  mode="immediate"
                  previewSize={{ width: 200, height: 150 }}
                  maxFiles={1}
                  folder="section-images"
                  value={getUploadValue(item)}
                  onUpload={(files) => handleUpload(item.id, files)}
                  onDelete={() => handleDelete(item.id)}
                  imageProcessingOptions={PRESET_CONTENT}
                />
              </div>

              {/* 並べ替えボタン */}
              <div className="flex justify-center gap-1 mb-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMove(item.id, 'left')}
                  disabled={index === 0}
                  aria-label="左に移動"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-2">
                  {index + 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMove(item.id, 'right')}
                  disabled={index === sortedItems.length - 1}
                  aria-label="右に移動"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 詳細設定（アコーディオン） */}
        <Accordion type="single" collapsible className="w-full">
          {sortedItems.map((item, index) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-sm">
                画像 {index + 1} の詳細設定
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {/* タイトル */}
                  <div className="space-y-1">
                    <Label className="text-xs">タイトル（左下）</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      placeholder="タイトル"
                      maxLength={30}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* サブタイトル */}
                  <div className="space-y-1">
                    <Label className="text-xs">サブタイトル（左下バッジ）</Label>
                    <Input
                      value={item.subtitle}
                      onChange={(e) => updateItem(item.id, { subtitle: e.target.value })}
                      placeholder="サブタイトル"
                      maxLength={20}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* 右上バッジ */}
                  <div className="space-y-1">
                    <Label className="text-xs">右上バッジ</Label>
                    <Input
                      value={item.overlayText}
                      onChange={(e) => updateItem(item.id, { overlayText: e.target.value })}
                      placeholder="右上バッジ"
                      maxLength={15}
                      className="h-8 text-sm"
                    />
                  </div>

                  {/* リンクURL */}
                  <div className="space-y-1">
                    <Label className="text-xs">リンクURL</Label>
                    <Input
                      type="url"
                      value={item.linkUrl}
                      onChange={(e) => updateItem(item.id, { linkUrl: e.target.value })}
                      placeholder="https://example.com"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* 保存ボタン */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="flex-1">
            {isPending ? '処理中...' : '完了'}
          </Button>
        </div>
      </div>
    </EditModal>
  )
}
