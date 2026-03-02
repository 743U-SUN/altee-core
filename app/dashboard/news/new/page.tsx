import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserNewsForm } from '../components/UserNewsForm'

export const metadata: Metadata = {
  title: 'ニュース作成',
  robots: { index: false, follow: false },
}

export default async function NewUserNewsPage() {
  const session = await cachedAuth()
  if (!session?.user?.id) redirect('/auth/signin')

  return (
    <div className="flex flex-1 flex-col p-6 max-w-4xl mx-auto w-full">
      <UserNewsForm />
    </div>
  )
}
