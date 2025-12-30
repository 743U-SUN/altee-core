/**
 * Twitch API サービス
 * Twitch API の呼び出しとEventSub管理を担当
 */

import { prisma } from "@/lib/prisma"

/**
 * Twitch App Access Token を取得
 */
async function getTwitchAppAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error("[Twitch API] Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET")
    return null
  }

  try {
    const response = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
    })

    if (!response.ok) {
      console.error("[Twitch API] Failed to get app access token:", response.status)
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("[Twitch API] Error getting app access token:", error)
    return null
  }
}

/**
 * Twitch Username から User ID を取得
 */
export async function getTwitchUserId(username: string): Promise<{
  success: boolean
  userId?: string
  error?: string
}> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    const accessToken = await getTwitchAppAccessToken()

    if (!clientId || !accessToken) {
      return { success: false, error: "Twitch API credentials not configured" }
    }

    const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.error("[Twitch API] Failed to get user ID:", response.status)
      return { success: false, error: `Failed to get user ID: ${response.status}` }
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      return { success: false, error: "User not found" }
    }

    return { success: true, userId: data.data[0].id }
  } catch (error) {
    console.error("[Twitch API] Error getting user ID:", error)
    return { success: false, error: "Failed to get user ID" }
  }
}

/**
 * Twitch EventSub Subscription を作成
 */
export async function createTwitchEventSub(
  twitchUserId: string,
  userId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    const accessToken = await getTwitchAppAccessToken()
    const webhookSecret = process.env.TWITCH_WEBHOOK_SECRET
    const domain = process.env.NEXT_PUBLIC_DOMAIN || "localhost"

    if (!clientId || !accessToken || !webhookSecret) {
      return { success: false, error: "Twitch API credentials not configured" }
    }

    const callbackUrl = `https://${domain}/api/webhooks/twitch/eventsub`

    // stream.online と stream.offline の2つのサブスクリプションを作成
    const subscriptionTypes = ["stream.online", "stream.offline"]

    for (const type of subscriptionTypes) {
      const response = await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
        method: "POST",
        headers: {
          "Client-ID": clientId,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          version: "1",
          condition: {
            broadcaster_user_id: twitchUserId,
          },
          transport: {
            method: "webhook",
            callback: callbackUrl,
            secret: webhookSecret,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[Twitch EventSub] Failed to create ${type} subscription:`, errorText)
        return { success: false, error: `Failed to create EventSub subscription: ${response.status}` }
      }

      const data = await response.json()
      const subscriptionId = data.data[0]?.id
      const status = data.data[0]?.status

      if (!subscriptionId) {
        return { success: false, error: "No subscription ID returned" }
      }

      // データベースに保存
      await prisma.twitchEventSubSubscription.create({
        data: {
          userId,
          subscriptionId,
          type,
          status: status || "unknown",
        },
      })

      console.log(`[Twitch EventSub] Created ${type} subscription: ${subscriptionId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("[Twitch EventSub] Error creating subscription:", error)
    return { success: false, error: "Failed to create EventSub subscription" }
  }
}

/**
 * Twitch EventSub Subscription を削除
 */
export async function deleteTwitchEventSub(userId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const clientId = process.env.TWITCH_CLIENT_ID
    const accessToken = await getTwitchAppAccessToken()

    if (!clientId || !accessToken) {
      return { success: false, error: "Twitch API credentials not configured" }
    }

    // データベースから既存のサブスクリプションを取得
    const subscriptions = await prisma.twitchEventSubSubscription.findMany({
      where: { userId },
    })

    // 各サブスクリプションをTwitch APIから削除
    for (const subscription of subscriptions) {
      const response = await fetch(
        `https://api.twitch.tv/helix/eventsub/subscriptions?id=${subscription.subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!response.ok) {
        console.error(`[Twitch EventSub] Failed to delete subscription ${subscription.subscriptionId}:`, response.status)
      } else {
        console.log(`[Twitch EventSub] Deleted subscription: ${subscription.subscriptionId}`)
      }
    }

    // データベースから削除
    await prisma.twitchEventSubSubscription.deleteMany({
      where: { userId },
    })

    return { success: true }
  } catch (error) {
    console.error("[Twitch EventSub] Error deleting subscriptions:", error)
    return { success: false, error: "Failed to delete EventSub subscriptions" }
  }
}

/**
 * Twitch EventSub Subscription のステータスを取得
 */
export async function getTwitchEventSubStatus(userId: string): Promise<{
  success: boolean
  isSubscribed: boolean
  subscriptions?: Array<{ type: string; status: string }>
  error?: string
}> {
  try {
    const subscriptions = await prisma.twitchEventSubSubscription.findMany({
      where: { userId },
      select: {
        type: true,
        status: true,
      },
    })

    return {
      success: true,
      isSubscribed: subscriptions.length > 0,
      subscriptions,
    }
  } catch (error) {
    console.error("[Twitch EventSub] Error getting subscription status:", error)
    return { success: false, isSubscribed: false, error: "Failed to get subscription status" }
  }
}
