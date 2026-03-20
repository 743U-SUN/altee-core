import { cachedAuth } from '@/lib/auth'
import { redirect, notFound } from "next/navigation"
import { getCategory } from "@/app/actions/content/category-actions"
import { CategoryForm } from "../components/CategoryForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: PageProps) {
  const session = await cachedAuth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params

  try {
    const category = await getCategory(id)
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