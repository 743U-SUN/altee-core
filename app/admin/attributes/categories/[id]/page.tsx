import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getCategory } from "@/app/actions/category-actions"
import { CategoryForm } from "../components/CategoryForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditCategoryPage({ params }: PageProps) {
  const session = await auth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params

  try {
    const category = await getCategory(id)
    return <CategoryForm category={category} mode="edit" />
  } catch (error) {
    console.error('Category fetch error:', error)
    notFound()
  }
}