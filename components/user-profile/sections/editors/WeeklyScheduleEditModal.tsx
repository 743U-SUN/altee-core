'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import { PRESET_AVATAR } from '@/lib/image-uploader/image-processing-presets'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import type { WeeklyScheduleData } from '@/types/profile-sections'
import type { UploadedFile } from '@/types/image-upload'
import { getDayInfo } from '../weekly-schedule-utils'

interface WeeklyScheduleEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: WeeklyScheduleData
  currentTitle?: string
}

/**
 * 週間スケジュール編集モーダル
 * 開始日・7日分の予定・背景画像を編集
 */
export function WeeklyScheduleEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
  currentTitle,
}: WeeklyScheduleEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(currentTitle ?? '')
  const [startDate, setStartDate] = useState(currentData.startDate ?? '')
  const [schedules, setSchedules] = useState<string[]>(
    currentData.schedules?.length === 7
      ? currentData.schedules
      : Array(7).fill('')
  )
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const handleScheduleChange = (index: number, value: string) => {
    setSchedules((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleDeleteImage = () => {
    startTransition(async () => {
      try {
        const newData: WeeklyScheduleData = {
          ...currentData,
          imageKey: undefined,
        }
        const result = await updateSection(sectionId, { data: newData })
        if (result.success) {
          toast.success('画像を削除しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '削除に失敗しました')
        }
      } catch {
        toast.error('削除中にエラーが発生しました')
      }
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        const newData: WeeklyScheduleData = {
          startDate,
          schedules,
          imageKey:
            uploadedFiles.length > 0
              ? uploadedFiles[0].key
              : currentData.imageKey,
        }

        const result = await updateSection(sectionId, {
          title: title.trim() || null,
          data: newData,
        })

        if (result.success) {
          toast.success('週間スケジュールを更新しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '更新に失敗しました')
        }
      } catch {
        toast.error('更新中にエラーが発生しました')
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="週間スケジュールを編集"
      isSaving={isPending}
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto">
        {/* セクションタイトル */}
        <div className="space-y-1">
          <Label htmlFor="section-title">セクションタイトル（任意）</Label>
          <Input
            id="section-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 今週の予定"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">{title.length}/50文字</p>
        </div>

        <Separator />

        {/* 開始日 */}
        <div className="space-y-1">
          <Label htmlFor="start-date">開始日</Label>
          <Input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            設定した日から7日分の入力欄が表示されます
          </p>
        </div>

        {/* 7日分の予定入力 */}
        {startDate && (
          <div className="space-y-2">
            <Label>週間予定</Label>
            <div className="space-y-2">
              {Array.from({ length: 7 }, (_, offset) => {
                const { weekday, label } = getDayInfo(startDate, offset)
                return (
                  <div key={offset} className="flex items-center gap-2">
                    {/* 曜日バッジ */}
                    <div className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold bg-accent text-accent-foreground">
                      {weekday}
                    </div>
                    {/* 日付ラベル */}
                    <span className="shrink-0 text-xs text-muted-foreground w-10">
                      {label}
                    </span>
                    {/* 予定入力 */}
                    <Input
                      value={schedules[offset] ?? ''}
                      onChange={(e) => handleScheduleChange(offset, e.target.value)}
                      placeholder="予定を入力（任意）"
                      maxLength={100}
                      className="flex-1"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!startDate && (
          <p className="text-center text-muted-foreground py-4 text-sm">
            開始日を設定すると予定入力欄が表示されます
          </p>
        )}

        <Separator />

        {/* 背景画像 */}
        <div className="space-y-2">
          <Label>背景画像（任意）</Label>
          <p className="text-xs text-muted-foreground">
            推奨: 1:1の正方形画像 ・ カード右側に表示されます
          </p>

          {currentData.imageKey && uploadedFiles.length === 0 && (
            <div className="space-y-2">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                <Image
                  src={getPublicUrl(currentData.imageKey)}
                  alt="現在の背景画像"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteImage}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                画像を削除
              </Button>
            </div>
          )}

          <ImageUploader
            mode="immediate"
            maxFiles={1}
            maxSize={5 * 1024 * 1024}
            folder="weekly-schedule-images"
            previewSize="small"
            rounded={false}
            value={uploadedFiles}
            onUpload={setUploadedFiles}
            imageProcessingOptions={PRESET_AVATAR}
          />
        </div>
      </div>
    </EditModal>
  )
}
