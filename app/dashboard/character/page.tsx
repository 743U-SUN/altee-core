import { getCharacterInfo } from "@/app/actions/user/character-actions"
import { BasicInfoForm } from "./components/BasicInfoForm"

export default async function CharacterBasicInfoPage() {
  const result = await getCharacterInfo()

  if (!result.success) {
    return <p className="text-destructive">{result.error}</p>
  }

  return <BasicInfoForm initialData={result.data ?? null} />
}
