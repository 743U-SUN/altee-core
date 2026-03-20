import { getCharacterInfo } from "@/app/actions/user/character-actions"
import { CollabSettingsForm } from "../components/CollabSettingsForm"

export default async function CharacterCollabPage() {
  const result = await getCharacterInfo()

  if (!result.success) {
    return <p className="text-destructive">{result.error}</p>
  }

  return <CollabSettingsForm initialData={result.data ?? null} />
}
