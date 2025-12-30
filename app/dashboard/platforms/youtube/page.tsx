import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserYoutubeSettings } from "@/app/actions/platform-actions"
import { YouTubeTabContent } from "../components/YouTubeTabContent"

export default async function YouTubePlatformPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const youtubeResult = await getUserYoutubeSettings()

  return (
    <div className="space-y-6">
      <YouTubeTabContent
        initialData={youtubeResult.success && youtubeResult.data ? youtubeResult.data : null}
      />
    </div>
  )
}
