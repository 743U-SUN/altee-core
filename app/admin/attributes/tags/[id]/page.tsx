import { auth } from "@/auth"
import { redirect, notFound } from "next/navigation"
import { getTag } from "@/app/actions/tag-actions"
import { TagForm } from "../components/TagForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTagPage({ params }: PageProps) {
  const session = await auth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params

  try {
    const tag = await getTag(id)
    return <TagForm tag={tag} mode="edit" />
  } catch (error) {
    console.error('Tag fetch error:', error)
    notFound()
  }
}