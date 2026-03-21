import type { Metadata } from 'next'
import { requireAuth } from '@/lib/auth'
import { getDashboardCharacterInfo } from '@/lib/queries/character-queries'
import { GameSettingsForm } from "../components/GameSettingsForm"

export const metadata: Metadata = {
  title: 'ゲーム設定',
  robots: { index: false, follow: false },
}

export default async function CharacterGamePage() {
  const session = await requireAuth()
  const characterInfo = await getDashboardCharacterInfo(session.user.id)

  return <GameSettingsForm initialData={characterInfo ?? null} />
}
