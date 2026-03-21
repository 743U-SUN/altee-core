import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getDashboardCharacterInfo } from '@/lib/queries/character-queries'
import { CollabSettingsForm } from "../components/CollabSettingsForm"

export const metadata: Metadata = {
  title: 'コラボ設定',
  robots: { index: false, follow: false },
}

export default async function CharacterCollabPage() {
  const session = await requireAuth()
  const characterInfo = await getDashboardCharacterInfo(session.user.id)

  return <CollabSettingsForm initialData={characterInfo ?? null} />
}
