import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getUserNewsById } from '@/app/actions/content/user-news-actions'
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
  const session = await cachedAuth()
  if (!session?.user?.id) redirect('/auth/signin')

  const { id } = await params

  try {
    const result = await getUserNewsById(id)
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
