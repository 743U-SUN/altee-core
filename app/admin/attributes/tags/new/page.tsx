import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { TagForm } from "../components/TagForm"

export default async function NewTagPage() {
  const session = await auth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return <TagForm mode="create" />
}