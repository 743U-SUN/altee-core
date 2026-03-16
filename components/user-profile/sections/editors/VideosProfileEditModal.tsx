'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EditModal } from '../../EditModal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateSection } from '@/app/actions/user/section-actions'
import { toast } from 'sonner'
import type { VideosProfileData } from '@/types/profile-sections'

const schema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(50, '50文字以内で入力してください'),
  description: z.string().max(200, '200文字以内で入力してください'),
})

type FormValues = z.infer<typeof schema>

interface VideosProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: VideosProfileData
}

export function VideosProfileEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: VideosProfileEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: currentData.title || '',
      description: currentData.description || '',
    },
  })

  const titleValue = watch('title')
  const descriptionValue = watch('description')

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        const newData: VideosProfileData = {
          title: values.title,
          description: values.description || undefined,
        }
        const result = await updateSection(sectionId, { data: newData })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '更新に失敗しました')
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
      }
    })
  }

  return (
    <EditModal isOpen={isOpen} onClose={onClose} title="動画ページプロフィールを編集" hideActions>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">タイトル</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="動画ページのタイトル"
            maxLength={50}
          />
          <div className="flex justify-between">
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
            <p className="text-xs text-muted-foreground ml-auto">{titleValue?.length || 0}/50</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">説明文</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="動画ページの説明文（任意）"
            maxLength={200}
            rows={3}
          />
          <div className="flex justify-between">
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
            <p className="text-xs text-muted-foreground ml-auto">{descriptionValue?.length || 0}/200</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1">
            キャンセル
          </Button>
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? '処理中...' : '完了'}
          </Button>
        </div>
      </form>
    </EditModal>
  )
}
