import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserNews } from '@/app/actions/content/user-news-actions'
import { UserNewsListClient } from './components/UserNewsListClient'
import type { UserNewsWithImages } from '@/types/user-news'

export const metadata: Metadata = {
  title: 'NEWS管理',
  robots: { index: false, follow: false },
}

export default async function DashboardNewsPage() {
  const session = await cachedAuth()
  if (!session?.user?.id) redirect('/auth/signin')

  const result = await getUserNews()
  const initialData = result.success ? (result.data as UserNewsWithImages[]) : []

  return (
    <div className="flex flex-1 flex-col p-6 max-w-4xl mx-auto w-full">
      <UserNewsListClient initialData={initialData} />
    </div>
  )
}
