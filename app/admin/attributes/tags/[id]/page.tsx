import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth'
import { notFound } from "next/navigation"
import { getAdminTag } from '@/lib/queries/article-queries'
import { TagForm } from "../components/TagForm"

export const metadata: Metadata = {
  title: 'タグ編集 | Admin',
  robots: { index: false, follow: false },
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditTagPage({ params }: PageProps) {
  await requireAdmin()

  const { id } = await params

  try {
    const tag = await getAdminTag(id)
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
  } catch {
    notFound()
  }
}
