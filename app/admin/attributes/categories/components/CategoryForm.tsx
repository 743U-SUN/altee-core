'use client'

import { AttributeForm } from '../../components/AttributeForm'
import { createCategory, updateCategory } from '@/app/actions/content/category-actions'
import { toast } from 'sonner'
import type { CategoryWithArticles } from './types'

interface CategoryFormProps {
  category?: CategoryWithArticles
  mode: 'create' | 'edit'
}

export function CategoryForm({ category, mode }: CategoryFormProps) {
  const handleSubmit = async (
    values: { name: string; slug: string; description?: string; color?: string; order?: number },
    id?: string
  ) => {
    const formData = new FormData()
    formData.append('name', values.name)
    formData.append('slug', values.slug)
    if (values.description) formData.append('description', values.description)
    if (values.color) formData.append('color', values.color)
    formData.append('order', values.order?.toString() || '0')

    if (mode === 'create') {
      await createCategory(formData)
      toast.success('カテゴリが作成されました')
    } else if (id) {
      await updateCategory(id, formData)
      toast.success('カテゴリが更新されました')
    }
  }

  return (
    <AttributeForm
      item={category}
      mode={mode}
      entityLabel="カテゴリ"
      listPath="/admin/attributes/categories"
      hasOrder
      onSubmit={handleSubmit}
    />
  )
}
