import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { CategoryForm } from "../components/CategoryForm"

export default async function NewCategoryPage() {
  const session = await auth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return <CategoryForm mode="create" />
}