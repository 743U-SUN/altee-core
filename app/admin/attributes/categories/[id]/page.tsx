import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { notFound } from "next/navigation"
import { getAdminCategory } from '@/lib/queries/article-queries'
import { CategoryForm } from "../components/CategoryForm"

export const metadata: Metadata = {
  title: 'カテゴリ編集 | Admin',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: PageProps) {
  await requireAdmin()

  const { id } = await params

  try {
    const category = await getAdminCategory(id)
    const serializedCategory = {
      ...category,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
      articles: category.articles.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    }
    return <CategoryForm category={serializedCategory} mode="edit" />
  } catch {
    notFound()
  }
}
