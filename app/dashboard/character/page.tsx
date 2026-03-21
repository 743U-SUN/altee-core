import { cachedAuth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardCharacterInfo } from "@/lib/queries/character-queries"
import { toBasicInfoDefaults } from "@/lib/validations/character"
import { BasicInfoForm } from "./components/BasicInfoForm"

export default async function CharacterBasicInfoPage() {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const characterInfo = await getDashboardCharacterInfo(session.user.id)
  // Date フィールドを文字列にシリアライズしてからクライアントコンポーネントへ渡す
  const initialData = characterInfo ? toBasicInfoDefaults(characterInfo) : null

  return <BasicInfoForm initialData={initialData} />
}
