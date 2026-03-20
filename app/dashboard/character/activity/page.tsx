import { getCharacterInfo } from "@/app/actions/user/character-actions"
import { ActivityForm } from "../components/ActivityForm"

export default async function CharacterActivityPage() {
  const result = await getCharacterInfo()

  if (!result.success) {
    return <p className="text-destructive">{result.error}</p>
  }

  return <ActivityForm initialData={result.data ?? null} />
}
