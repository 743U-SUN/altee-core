'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Tag, Folder } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createCategory } from "@/app/actions/content/category-actions"
import { createTag } from "@/app/actions/content/tag-actions"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"
import type { CategoryItem, TagItem } from './types'

// --- CheckboxSelectorCard: カテゴリ/タグ共通の選択UI ---

interface CheckboxSelectorCardProps<T extends { id: string; name: string; color: string | null }> {
  title: string
  icon: LucideIcon
  items: T[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  createDialogTitle: string
  createInputLabel: string
  createInputPlaceholder: string
  onCreate: (name: string) => Promise<T | null>
}

function CheckboxSelectorCard<T extends { id: string; name: string; color: string | null }>({
  title,
  icon: Icon,
  items,
  selectedIds,
  onSelectionChange,
  createDialogTitle,
  createInputLabel,
  createInputPlaceholder,
  onCreate,
}: CheckboxSelectorCardProps<T>) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleChange = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(sid => sid !== id))
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return

    setIsCreating(true)
    try {
      const created = await onCreate(newName.trim())
      if (created) {
        onSelectionChange([...selectedIds, created.id])
        setNewName('')
        setDialogOpen(false)
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                新規作成
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{createDialogTitle}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="newItemName">{createInputLabel}</Label>
                  <Input
                    id="newItemName"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={createInputPlaceholder}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !newName.trim()}
                  >
                    {isCreating ? '作成中...' : '作成'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{title}がありません</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`item-${item.id}`}
                  checked={selectedIds.includes(item.id)}
                  onCheckedChange={(checked) =>
                    handleChange(item.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`item-${item.id}`}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  {item.color && (
                    <div
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  {item.name}
                </Label>
              </div>
            ))
          )}
        </div>
        {selectedIds.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Label className="text-sm font-medium">選択中の{title}:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedIds.map((id) => {
                const item = items.find(i => i.id === id)
                return item ? (
                  <Badge key={id} variant="secondary">
                    {item.name}
                    <button
                      onClick={() => handleChange(id, false)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// --- CategoryTagSelector ---

interface CategoryTagSelectorProps {
  initialCategories: CategoryItem[]
  initialTags: TagItem[]
  selectedCategoryIds: string[]
  selectedTagIds: string[]
  onCategoriesChange: (categoryIds: string[]) => void
  onTagsChange: (tagIds: string[]) => void
}

export function CategoryTagSelector({
  initialCategories,
  initialTags,
  selectedCategoryIds,
  selectedTagIds,
  onCategoriesChange,
  onTagsChange,
}: CategoryTagSelectorProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories)
  const [tags, setTags] = useState<TagItem[]>(initialTags)

  const handleCreateCategory = async (name: string): Promise<CategoryItem | null> => {
    try {
      const formData = new FormData()
      formData.append('name', name)
      const result = await createCategory(formData)
      if (result.success) {
        setCategories(prev => [...prev, result.category])
        toast.success('カテゴリを作成しました')
        return result.category
      }
      return null
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリの作成に失敗しました')
      return null
    }
  }

  const handleCreateTag = async (name: string): Promise<TagItem | null> => {
    try {
      const formData = new FormData()
      formData.append('name', name)
      const result = await createTag(formData)
      if (result.success) {
        setTags(prev => [...prev, result.tag])
        toast.success('タグを作成しました')
        return result.tag
      }
      return null
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'タグの作成に失敗しました')
      return null
    }
  }

  return (
    <div className="space-y-4">
      <CheckboxSelectorCard
        title="カテゴリ"
        icon={Folder}
        items={categories}
        selectedIds={selectedCategoryIds}
        onSelectionChange={onCategoriesChange}
        createDialogTitle="新しいカテゴリを作成"
        createInputLabel="カテゴリ名"
        createInputPlaceholder="カテゴリ名を入力"
        onCreate={handleCreateCategory}
      />
      <CheckboxSelectorCard
        title="タグ"
        icon={Tag}
        items={tags}
        selectedIds={selectedTagIds}
        onSelectionChange={onTagsChange}
        createDialogTitle="新しいタグを作成"
        createInputLabel="タグ名"
        createInputPlaceholder="タグ名を入力"
        onCreate={handleCreateTag}
      />
    </div>
  )
}
