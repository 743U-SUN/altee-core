import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getDashboardCharacterInfo } from '@/lib/queries/character-queries'
import { ActivityForm } from "../components/ActivityForm"

export const metadata: Metadata = {
  title: '活動情報設定',
  robots: { index: false, follow: false },
}

export default async function CharacterActivityPage() {
  const session = await requireAuth()
  const characterInfo = await getDashboardCharacterInfo(session.user.id)

  return <ActivityForm initialData={characterInfo ?? null} />
}
