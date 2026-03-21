import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { getDashboardNewsById } from '@/lib/queries/news-queries'
import { UserNewsForm } from '../components/UserNewsForm'
import type { UserNewsWithImages } from '@/types/user-news'

export const metadata: Metadata = {
  title: 'ニュース編集',
  robots: { index: false, follow: false },
}

export default async function EditUserNewsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireAuth()
  const { id } = await params

  try {
    const result = await getDashboardNewsById(id, session.user.id)
    const newsData = result.data as UserNewsWithImages

    return (
      <div className="flex flex-1 flex-col p-6 max-w-4xl mx-auto w-full">
        <UserNewsForm editData={newsData} />
      </div>
    )
  } catch {
    notFound()
  }
}
