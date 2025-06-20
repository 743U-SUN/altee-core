'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Tag, Folder } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getAllCategories, createCategory } from "@/app/actions/category-actions"
import { getAllTags, createTag } from "@/app/actions/tag-actions"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Category {
  id: string
  name: string
  slug: string
  color: string | null
}

interface TagType {
  id: string
  name: string
  slug: string
  color: string | null
}

interface CategoryTagSelectorProps {
  selectedCategoryIds: string[]
  selectedTagIds: string[]
  onCategoriesChange: (categoryIds: string[]) => void
  onTagsChange: (tagIds: string[]) => void
}

function CategoryTagSelectorSkeleton() {
  return (
    <div className="space-y-4">
      {/* カテゴリ選択 Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              カテゴリ
            </CardTitle>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>

      {/* タグ選択 Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              タグ
            </CardTitle>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CategoryTagSelector({
  selectedCategoryIds,
  selectedTagIds,
  onCategoriesChange,
  onTagsChange
}: CategoryTagSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<TagType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // 新規作成用のstate
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [categoriesData, tagsData] = await Promise.all([
        getAllCategories(),
        getAllTags()
      ])
      setCategories(categoriesData)
      setTags(tagsData)
    } catch {
      toast.error('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    if (checked) {
      onCategoriesChange([...selectedCategoryIds, categoryId])
    } else {
      onCategoriesChange(selectedCategoryIds.filter(id => id !== categoryId))
    }
  }

  const handleTagChange = (tagId: string, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTagIds, tagId])
    } else {
      onTagsChange(selectedTagIds.filter(id => id !== tagId))
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return

    setIsCreatingCategory(true)
    try {
      const formData = new FormData()
      formData.append('name', newCategoryName.trim())
      
      const result = await createCategory(formData)
      
      if (result.success) {
        setCategories([...categories, result.category])
        onCategoriesChange([...selectedCategoryIds, result.category.id])
        setNewCategoryName('')
        setCategoryDialogOpen(false)
        toast.success('カテゴリを作成しました')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'カテゴリの作成に失敗しました')
    } finally {
      setIsCreatingCategory(false)
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setIsCreatingTag(true)
    try {
      const formData = new FormData()
      formData.append('name', newTagName.trim())
      
      const result = await createTag(formData)
      
      if (result.success) {
        setTags([...tags, result.tag])
        onTagsChange([...selectedTagIds, result.tag.id])
        setNewTagName('')
        setTagDialogOpen(false)
        toast.success('タグを作成しました')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'タグの作成に失敗しました')
    } finally {
      setIsCreatingTag(false)
    }
  }

  if (isLoading) {
    return <CategoryTagSelectorSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* カテゴリ選択 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              カテゴリ
            </CardTitle>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新規作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新しいカテゴリを作成</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">カテゴリ名</Label>
                    <Input
                      id="categoryName"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="カテゴリ名を入力"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateCategory}
                      disabled={isCreatingCategory || !newCategoryName.trim()}
                    >
                      {isCreatingCategory ? '作成中...' : '作成'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setCategoryDialogOpen(false)}
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
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">カテゴリがありません</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.id}`}
                    checked={selectedCategoryIds.includes(category.id)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`category-${category.id}`}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    {category.color && (
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    {category.name}
                  </Label>
                </div>
              ))
            )}
          </div>
          {selectedCategoryIds.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-sm font-medium">選択中のカテゴリ:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategoryIds.map((categoryId) => {
                  const category = categories.find(c => c.id === categoryId)
                  return category ? (
                    <Badge key={categoryId} variant="secondary">
                      {category.name}
                      <button
                        onClick={() => handleCategoryChange(categoryId, false)}
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

      {/* タグ選択 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              タグ
            </CardTitle>
            <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  新規作成
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新しいタグを作成</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tagName">タグ名</Label>
                    <Input
                      id="tagName"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="タグ名を入力"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateTag}
                      disabled={isCreatingTag || !newTagName.trim()}
                    >
                      {isCreatingTag ? '作成中...' : '作成'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setTagDialogOpen(false)}
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
            {tags.length === 0 ? (
              <p className="text-muted-foreground text-sm">タグがありません</p>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={(checked) => 
                      handleTagChange(tag.id, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`tag-${tag.id}`}
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    {tag.color && (
                      <div 
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    {tag.name}
                  </Label>
                </div>
              ))
            )}
          </div>
          {selectedTagIds.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-sm font-medium">選択中のタグ:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTagIds.map((tagId) => {
                  const tag = tags.find(t => t.id === tagId)
                  return tag ? (
                    <Badge key={tagId} variant="secondary">
                      {tag.name}
                      <button
                        onClick={() => handleTagChange(tagId, false)}
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
    </div>
  )
}