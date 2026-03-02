import { getCharacterInfo } from "@/app/actions/user/character-actions"
import { GameSettingsForm } from "../components/GameSettingsForm"

export default async function CharacterGamePage() {
  const result = await getCharacterInfo()

  if (!result.success) {
    return <p className="text-destructive">{result.error}</p>
  }

  return <GameSettingsForm initialData={result.data ?? null} />
}
