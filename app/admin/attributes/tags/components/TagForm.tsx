'use client'

import { AttributeForm } from '../../components/AttributeForm'
import { createTag, updateTag } from '@/app/actions/content/tag-actions'
import { toast } from 'sonner'
import type { TagWithArticles } from './types'

interface TagFormProps {
  tag?: TagWithArticles
  mode: 'create' | 'edit'
}

export function TagForm({ tag, mode }: TagFormProps) {
  const handleSubmit = async (
    values: { name: string; slug: string; description?: string; color?: string; order?: number },
    id?: string
  ) => {
    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('slug', values.slug)
    if (values.description) formData.append('description', values.description)
    if (values.color) formData.append('color', values.color)

    if (mode === 'create') {
      await createTag(formData)
      toast.success('タグが作成されました')
    } else if (id) {
      await updateTag(id, formData)
      toast.success('タグが更新されました')
    }
  }

  return (
    <AttributeForm
      item={tag}
      mode={mode}
      entityLabel="タグ"
      listPath="/admin/attributes/tags"
      onSubmit={handleSubmit}
    />
  )
}
