import type { Metadata } from 'next'
import { cachedAuth } from '@/lib/auth'
import { redirect } from "next/navigation"
import { getUserTwitchSettings, getTwitchEventSubSubscriptionStatus } from "@/app/actions/social/twitch-actions"
import { TwitchTabContent } from "../components/TwitchTabContent"

export const metadata: Metadata = {
  title: 'Twitch設定',
  description: 'Twitchチャンネル設定とライブ配信管理',
}

export default async function TwitchPlatformPage() {
  const session = await cachedAuth()

  if (!session?.user?.id) {
    redirect("/auth/signin")
  }

  const twitchResult = await getUserTwitchSettings()
  const twitchData = twitchResult.success && twitchResult.data ? twitchResult.data : null

  // twitchUserIdが存在する場合のみsubscriptionステータスをサーバーで取得（waterfall解消）
  const subStatusResult = twitchData?.twitchUserId
    ? await getTwitchEventSubSubscriptionStatus()
    : null

  return (
    <div className="space-y-6">
      <TwitchTabContent
        initialData={twitchData}
        initialIsSubscribed={subStatusResult?.isSubscribed ?? false}
      />
    </div>
  )
}
