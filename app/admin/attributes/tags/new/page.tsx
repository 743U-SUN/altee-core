import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { TagForm } from "../components/TagForm"

export default async function NewTagPage() {
  const session = await cachedAuth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return <TagForm mode="create" />
}