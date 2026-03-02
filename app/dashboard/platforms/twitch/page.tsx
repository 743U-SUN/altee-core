import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { getUserTwitchSettings } from "@/app/actions/social/twitch-actions"
import { TwitchTabContent } from "../components/TwitchTabContent"

export default async function TwitchPlatformPage() {
  const session = await cachedAuth()

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
