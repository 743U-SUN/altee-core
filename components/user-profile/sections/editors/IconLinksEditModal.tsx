'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IconSelector } from '@/components/ui/icon-selector'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { updateSection } from '@/app/actions/user/section-actions'
import { getCustomIcons } from '@/app/actions/admin/icon-actions'
import type { CustomIcon } from '@/app/actions/admin/icon-actions'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { IconLinksData } from '@/types/profile-sections'
import { nanoid } from 'nanoid'

interface IconLinksEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: IconLinksData
}

type EditingIconLink = {
  id: string
  url: string
  platform: string
  iconType: 'lucide' | 'custom'
  lucideIconName?: string
  customIconUrl?: string
  sortOrder: number
}

/**
 * アイコンリンク編集モーダル
 * SNS・連絡先アイコンを管理
 */
const fetchCustomIcons = async (): Promise<CustomIcon[]> => {
  const result = await getCustomIcons()
  return result.success && result.icons ? result.icons : []
}

export function IconLinksEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: IconLinksEditModalProps) {
  const router = useRouter()
  const [links, setLinks] = useState<EditingIconLink[]>(
    currentData.items.map((item) => ({ ...item }))
  )

  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editingBackup, setEditingBackup] = useState<EditingIconLink | null>(null)

  const [isPending, startTransition] = useTransition()

  // カスタムアイコンを取得（保存時にURL解決するため）
  // IconSelector と同じキー 'custom-icons' で SWR キャッシュを共有
  const { data: customIcons = [] } = useSWR('custom-icons', fetchCustomIcons)

  // リンクを追加（自動的に編集モードに）
  const handleAddLink = () => {
    const newLink: EditingIconLink = {
      id: nanoid(),
      url: '',
      platform: '',
      iconType: 'lucide',
      lucideIconName: 'Link',
      sortOrder: links.length,
    }
    setLinks([...links, newLink])
    setEditingBackup({ ...newLink }) // バックアップ保存
    setEditingLinkId(newLink.id)
  }

  // 編集を閉じる（内容は保持、バックアップはクリア）
  const handleCloseEdit = () => {
    setEditingLinkId(null)
    setEditingBackup(null)
  }

  // リンクの編集を開始/終了（トグル）
  const handleToggleEdit = (linkId: string) => {
    if (editingLinkId === linkId) {
      handleCloseEdit()
      return
    }
    const link = links.find((l) => l.id === linkId)
    if (link) {
      setEditingBackup({ ...link }) // バックアップ保存
      setEditingLinkId(linkId)
    }
  }

  // フィールド変更（ローカルstateのみ更新、DB保存なし）
  const handleFieldChange = (linkId: string, field: 'platform' | 'url', value: string) => {
    setLinks((prev) =>
      prev.map((link) => (link.id === linkId ? { ...link, [field]: value } : link))
    )
  }

  // アイコン選択の変更（ローカルstateのみ更新、DB保存なし）
  const handleIconChange = (linkId: string, iconSelection: string) => {
    // アイコン選択を解決
    let iconType: 'lucide' | 'custom' = 'lucide'
    let lucideIconName: string | undefined
    let customIconUrl: string | undefined

    if (iconSelection.startsWith('custom:')) {
      const iconId = iconSelection.replace('custom:', '')
      const found = customIcons.find((ic) => ic.id === iconId)
      if (found) {
        iconType = 'custom'
        customIconUrl = found.url
      }
    } else if (iconSelection) {
      iconType = 'lucide'
      lucideIconName = iconSelection
    }

    // linksに反映
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId
          ? { ...l, iconType, lucideIconName, customIconUrl }
          : l
      )
    )
  }

  // Escapeキーで編集キャンセル（編集中のリンクのみ元に戻す）
  const handleEscapeEdit = () => {
    if (editingLinkId && editingBackup) {
      // 編集中のリンクのみバックアップから復元
      setLinks((prev) =>
        prev.map((link) =>
          link.id === editingLinkId ? { ...editingBackup } : link
        )
      )
    }
    setEditingLinkId(null)
    setEditingBackup(null)
  }

  // リンクを削除（ローカルstateのみ更新、DB保存なし）
  const handleDeleteLink = (linkId: string) => {
    if (!confirm('このリンクを削除しますか？')) return
    const updatedLinks = links.filter((l) => l.id !== linkId)
    setLinks(updatedLinks)
    // DB保存はしない（完了ボタンで一括保存）
  }

  // リンクを上下に移動（ローカルstateのみ更新、DB保存なし）
  const handleMoveLinkOrder = (linkId: string, direction: 'up' | 'down') => {
    const index = links.findIndex((l) => l.id === linkId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === links.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const newLinks = [...links]
    ;[newLinks[index], newLinks[targetIndex]] = [
      newLinks[targetIndex],
      newLinks[index],
    ]

    // sortOrderを再計算
    const updatedLinks = newLinks.map((link, idx) => ({ ...link, sortOrder: idx }))
    setLinks(updatedLinks)
    // DB保存はしない（完了ボタンで一括保存）
  }

  // 完了処理（全変更を1回のみDB保存してモーダル閉じる）
  const handleSave = () => {
    // 未入力チェック
    const invalidLinks = links.filter((link) => !link.platform.trim() || !link.url.trim())
    if (invalidLinks.length > 0) {
      toast.error('プラットフォーム名またはURLが未入力の項目があります')
      return
    }

    startTransition(async () => {
      try {
        const linksData: IconLinksData = {
          items: links.map((link) => ({
            id: link.id,
            url: link.url,
            platform: link.platform,
            iconType: link.iconType,
            customIconUrl: link.customIconUrl,
            lucideIconName: link.lucideIconName,
            sortOrder: link.sortOrder,
          })),
        }

        const result = await updateSection(sectionId, { data: linksData })

        if (result.success) {
          toast.success('保存しました')
          onClose()
          router.refresh()
        } else {
          toast.error(result.error || '保存に失敗しました')
          // モーダルは開いたまま（編集継続可能）
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
        // モーダルは開いたまま（編集継続可能）
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="アイコンリンクを編集"
      isSaving={isPending}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* リンク追加ボタン */}
        <Button
          onClick={handleAddLink}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          リンクを追加
        </Button>

        {/* リンク一覧 */}
        {links.map((link, index) => {
          const isEditing = editingLinkId === link.id
          return (
            <Collapsible
              key={link.id}
              open={isEditing}
              onOpenChange={(open) => {
                if (open) {
                  handleToggleEdit(link.id)
                } else {
                  handleCloseEdit()
                }
              }}
              className="border rounded-lg p-4 bg-muted/30"
            >
              {/* 常に表示される部分 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {link.platform || '（プラットフォーム名未入力）'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {link.url || '（URL未入力）'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={editingLinkId !== null && editingLinkId !== link.id}
                    >
                      <Pencil className={cn("w-3.5 h-3.5", isEditing && "text-primary")} />
                    </Button>
                  </CollapsibleTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={() => handleDeleteLink(link.id)}
                    disabled={!!editingLinkId}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveLinkOrder(link.id, 'up')}
                    disabled={index === 0 || !!editingLinkId}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveLinkOrder(link.id, 'down')}
                    disabled={index === links.length - 1 || !!editingLinkId}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* 展開される編集フォーム */}
              <CollapsibleContent>
                <div className="pt-3 mt-3 border-t space-y-3">
                  <div>
                    <Label htmlFor={`platform-${link.id}`}>プラットフォーム名</Label>
                    <Input
                      id={`platform-${link.id}`}
                      value={link.platform}
                      onChange={(e) => handleFieldChange(link.id, 'platform', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="例: Twitter"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor={`url-${link.id}`}>URL</Label>
                    <Input
                      id={`url-${link.id}`}
                      value={link.url}
                      onChange={(e) => handleFieldChange(link.id, 'url', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="例: https://twitter.com/username"
                      type="url"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block">アイコン</Label>
                    <IconSelector
                      selectedIcon={
                        link.iconType === 'lucide' && link.lucideIconName
                          ? link.lucideIconName
                          : link.iconType === 'custom' && link.customIconUrl
                          ? `custom:${customIcons.find((ic) => ic.url === link.customIconUrl)?.id ?? ''}`
                          : ''
                      }
                      onIconSelect={(iconName) => handleIconChange(link.id, iconName)}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}

        {links.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            リンクを追加してください
          </p>
        )}
      </div>
    </EditModal>
  )
}
