'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { upsertUserPcBuild, deletePcBuildPart } from '@/app/actions/content/pc-build-actions'
import { pcBuildSchema, pcPartTypeLabels, type PcBuildInput } from '@/lib/validations/pc-build'
import type { UserPcBuildPart } from '@prisma/client'
import type { PcBuildWithParts } from '@/types/pc-build'
import { partTypeIconComponents } from '@/constants/pc-build'

const AddPcPartModal = dynamic(
  () => import('./AddPcPartModal').then((mod) => ({ default: mod.AddPcPartModal })),
  { ssr: false }
)
const EditPcPartModal = dynamic(
  () => import('./EditPcPartModal').then((mod) => ({ default: mod.EditPcPartModal })),
  { ssr: false }
)

interface PcBuildManagementSectionProps {
  initialPcBuild: PcBuildWithParts | null
}

export function PcBuildManagementSection({ initialPcBuild }: PcBuildManagementSectionProps) {
  const [parts, setParts] = useState<UserPcBuildPart[]>(initialPcBuild?.parts ?? [])
  const [isPending, startTransition] = useTransition()
  const [showAddPartModal, setShowAddPartModal] = useState(false)
  const [editingPart, setEditingPart] = useState<UserPcBuildPart | null>(null)
  const [deletingPartId, setDeletingPartId] = useState<string | null>(null)

  const form = useForm<PcBuildInput>({
    resolver: zodResolver(pcBuildSchema),
    defaultValues: {
      name: initialPcBuild?.name ?? '',
      description: initialPcBuild?.description ?? '',
      totalBudget: initialPcBuild?.totalBudget ?? undefined,
      isPublic: initialPcBuild?.isPublic ?? true,
    },
  })

  const onSubmitBuild = (data: PcBuildInput) => {
    startTransition(async () => {
      try {
        const result = await upsertUserPcBuild(data)
        if (result.success) {
          toast.success('PCビルド情報を保存しました')
        } else {
          toast.error(result.error ?? 'PCビルドの保存に失敗しました')
        }
      } catch {
        toast.error('PCビルドの保存に失敗しました')
      }
    })
  }

  const handlePartAdded = (part: UserPcBuildPart) => {
    setParts((prev) => [...prev, part].sort((a, b) => a.sortOrder - b.sortOrder))
  }

  const handlePartUpdated = (updated: UserPcBuildPart) => {
    setParts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
  }

  const handleDeletePart = async (partId: string) => {
    try {
      const result = await deletePcBuildPart(partId)
      if (result.success) {
        toast.success('パーツを削除しました')
        setParts((prev) => prev.filter((p) => p.id !== partId))
      } else {
        toast.error(result.error ?? 'パーツの削除に失敗しました')
      }
    } catch {
      toast.error('パーツの削除に失敗しました')
    } finally {
      setDeletingPartId(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* PCビルド設定フォーム */}
      <div>
        <h2 className="text-xl font-semibold mb-4">PCビルド設定</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitBuild)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ビルド名</FormLabel>
                  <FormControl>
                    <Input placeholder="例: Ultimate Creator Workstation" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>説明</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="PCビルドの説明..."
                      className="min-h-[80px]"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalBudget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>予算（円）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="例: 450000"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>手動入力の予算（空欄の場合はパーツ合計金額を表示）</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">公開設定</FormLabel>
                    <FormDescription>PCスペック情報を公開プロフィールに表示します</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                保存
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* パーツ管理 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">パーツ一覧</h2>
            <p className="text-sm text-muted-foreground">PCに搭載しているパーツを管理します</p>
          </div>
          <Button size="sm" onClick={() => setShowAddPartModal(true)}>
            <Plus className="h-4 w-4 mr-1" />
            パーツを追加
          </Button>
        </div>

        {parts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <p className="text-sm">パーツが登録されていません</p>
            <p className="text-xs mt-1">「パーツを追加」から登録を始めましょう</p>
          </div>
        ) : (
          <div className="divide-y border rounded-lg">
            {parts.map((part) => {
              const PartIcon = partTypeIconComponents[part.partType]
              return (
              <div key={part.id} className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <PartIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {pcPartTypeLabels[part.partType]}
                    </Badge>
                  </div>
                  <p className="font-medium text-sm mt-0.5 truncate">{part.name}</p>
                  {part.price != null && (
                    <p className="text-xs text-muted-foreground">¥{part.price.toLocaleString()}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setEditingPart(part)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => setDeletingPartId(part.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* モーダル */}
      {showAddPartModal && (
        <AddPcPartModal
          isOpen={showAddPartModal}
          onClose={() => setShowAddPartModal(false)}
          onPartAdded={handlePartAdded}
        />
      )}

      {editingPart && (
        <EditPcPartModal
          isOpen={!!editingPart}
          onClose={() => setEditingPart(null)}
          part={editingPart}
          onPartUpdated={handlePartUpdated}
        />
      )}

      {/* 削除確認ダイアログ */}
      <AlertDialog open={!!deletingPartId} onOpenChange={(open) => { if (!open) setDeletingPartId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>パーツを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。PCビルドからこのパーツが削除されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPartId && handleDeletePart(deletingPartId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
