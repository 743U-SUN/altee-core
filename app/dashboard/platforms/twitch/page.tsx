import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserTwitchSettings } from "@/app/actions/twitch-actions"
import { TwitchTabContent } from "../components/TwitchTabContent"

export default async function TwitchPlatformPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const twitchResult = await getUserTwitchSettings()

  return (
    <div className="space-y-6">
      <TwitchTabContent
        initialData={twitchResult.success && twitchResult.data ? twitchResult.data : null}
      />
    </div>
  )
}
