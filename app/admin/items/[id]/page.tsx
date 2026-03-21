import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getItemByIdAction, getCategoriesAction } from '../actions'
import { ItemForm } from '../components/ItemForm'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'アイテム編集 | 管理画面',
  description: 'アイテムを編集',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditItemPage({ params }: PageProps) {
  await requireAdmin()
  const { id } = await params

  const [itemResult, categoriesResult, brands] = await Promise.all([
    getItemByIdAction(id),
    getCategoriesAction(),
    prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  if (!itemResult.success || !itemResult.data) {
    notFound()
  }

  const categories =
    categoriesResult.success && categoriesResult.data
      ? categoriesResult.data
      : []

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">アイテム編集</h1>
        <p className="mt-2 text-muted-foreground">
          アイテム「{itemResult.data.name}」を編集
        </p>
      </div>

      <div className="max-w-4xl">
        <ItemForm
          item={itemResult.data}
          categories={categories}
          brands={brands}
        />
      </div>
    </div>
  )
}
