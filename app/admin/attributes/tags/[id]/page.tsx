import { cachedAuth } from '@/lib/auth'
import { redirect, notFound } from "next/navigation"
import { getTag } from "@/app/actions/content/tag-actions"
import { TagForm } from "../components/TagForm"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTagPage({ params }: PageProps) {
  const session = await cachedAuth()
  
  // 最終権限チェック（Page層）
  if (session?.user?.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const { id } = await params

  try {
    const tag = await getTag(id)
    const serializedTag = {
      ...tag,
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
      articles: tag.articles.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    }
    return <TagForm tag={serializedTag} mode="edit" />
  } catch (error) {
    console.error('Tag fetch error:', error)
    notFound()
  }
}