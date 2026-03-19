'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { EditModal } from '../../EditModal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { IconSelector } from '@/components/ui/icon-selector'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { updateSection } from '@/app/actions/user/section-actions'
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
import type { LinksData } from '@/types/profile-sections'
import { useEditableList } from './hooks/useEditableList'
import { useCustomIcons, resolveIconSelection, getSelectedIconValue } from '@/hooks/use-custom-icons'

interface LinksEditModalProps {
  isOpen: boolean
  onClose: () => void
  sectionId: string
  currentData: LinksData
}

type EditingLink = {
  id: string
  url: string
  title: string
  description?: string
  iconType: 'preset' | 'custom' | 'lucide'
  iconKey?: string
  customIconUrl?: string
  lucideIconName?: string
  sortOrder: number
}

export function LinksEditModal({
  isOpen,
  onClose,
  sectionId,
  currentData,
}: LinksEditModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const { data: customIcons = [] } = useCustomIcons()

  const {
    items: links,
    editingItemId: editingLinkId,
    handleAdd: handleAddLink,
    handleCloseEdit,
    handleToggleEdit,
    handleFieldChange,
    handleEscapeEdit,
    handleDelete: handleDeleteLink,
    handleMove: handleMoveLinkOrder,
    setItems: setLinks,
  } = useEditableList<EditingLink>({
    initialItems: currentData.items.map((item) => ({ ...item })),
    createEmptyItem: () => ({
      url: '',
      title: '',
      description: '',
      iconType: 'preset' as const,
    }),
  })

  const handleIconChange = (linkId: string, iconSelection: string) => {
    if (!iconSelection) {
      const existing = links.find((l) => l.id === linkId)
      if (existing?.iconType === 'preset') {
        return
      }
    }
    const resolved = resolveIconSelection(customIcons, iconSelection)
    setLinks((prev) =>
      prev.map((l) =>
        l.id === linkId
          ? { ...l, iconType: resolved.iconType, lucideIconName: resolved.lucideIconName, customIconUrl: resolved.customIconUrl, iconKey: resolved.iconKey }
          : l
      )
    )
  }

  const handleSave = () => {
    const invalidLinks = links.filter((link) => !link.title.trim() || !link.url.trim())
    if (invalidLinks.length > 0) {
      toast.error('タイトルまたはURLが未入力の項目があります')
      return
    }

    startTransition(async () => {
      try {
        const linksData: LinksData = {
          items: links.map((link) => ({
            id: link.id,
            url: link.url,
            title: link.title,
            description: link.description,
            iconType: link.iconType,
            iconKey: link.iconKey,
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
        }
      } catch {
        toast.error('保存中にエラーが発生しました')
      }
    })
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="リンクを編集"
      isSaving={isPending}
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        <Button
          onClick={handleAddLink}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          リンクを追加
        </Button>

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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ExternalLink className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {link.title || '（タイトル未入力）'}
                    </p>
                    {link.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {link.description}
                      </p>
                    )}
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

              <CollapsibleContent>
                <div className="pt-3 mt-3 border-t space-y-3">
                  <div>
                    <Label htmlFor={`title-${link.id}`}>タイトル</Label>
                    <Input
                      id={`title-${link.id}`}
                      value={link.title}
                      onChange={(e) => handleFieldChange(link.id, 'title', e.target.value)}
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
                    <Label htmlFor={`desc-${link.id}`}>
                      説明文（任意・最大50文字）
                    </Label>
                    <Textarea
                      id={`desc-${link.id}`}
                      value={link.description ?? ''}
                      onChange={(e) =>
                        handleFieldChange(link.id, 'description', e.target.value.slice(0, 50))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleEscapeEdit()
                        }
                      }}
                      placeholder="例: コミッション受付中"
                      rows={2}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      {(link.description ?? '').length}/50文字
                    </p>
                  </div>
                  <div>
                    <Label className="mb-2 block">アイコン（任意）</Label>
                    <IconSelector
                      selectedIcon={getSelectedIconValue(customIcons, link.iconType, link.lucideIconName, link.customIconUrl)}
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
