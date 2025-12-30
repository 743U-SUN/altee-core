/**
 * YouTube PubSubHubbub サービス
 * YouTube の新着動画通知を受け取るためのサブスクリプション管理
 */

/**
 * YouTube PubSubHubbub に subscribe
 */
export async function subscribeToYoutubePush(channelId: string): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/youtube`
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe"

    const formData = new URLSearchParams({
      "hub.callback": callbackUrl,
      "hub.topic": topicUrl,
      "hub.mode": "subscribe",
      "hub.verify": "async",
      "hub.lease_seconds": "864000", // 10 days
    })

    console.log(`[PubSubHubbub] Subscribing to channel ${channelId}`)

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (response.status === 202) {
      console.log(`[PubSubHubbub] Subscription request accepted for channel ${channelId}`)
      return { success: true, message: "Subscription request sent successfully" }
    } else {
      const errorText = await response.text()
      console.error(`[PubSubHubbub] Subscription failed:`, errorText)
      return { success: false, error: `Subscription failed: ${response.status}` }
    }
  } catch (error) {
    console.error("[PubSubHubbub] Subscription error:", error)
    return { success: false, error: "Subscription request failed" }
  }
}

/**
 * YouTube PubSubHubbub から unsubscribe
 */
export async function unsubscribeFromYoutubePush(channelId: string): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/youtube`
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe"

    const formData = new URLSearchParams({
      "hub.callback": callbackUrl,
      "hub.topic": topicUrl,
      "hub.mode": "unsubscribe",
      "hub.verify": "async",
    })

    console.log(`[PubSubHubbub] Unsubscribing from channel ${channelId}`)

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (response.status === 202) {
      console.log(`[PubSubHubbub] Unsubscription request accepted for channel ${channelId}`)
      return { success: true, message: "Unsubscription request sent successfully" }
    } else {
      const errorText = await response.text()
      console.error(`[PubSubHubbub] Unsubscription failed:`, errorText)
      return { success: false, error: `Unsubscription failed: ${response.status}` }
    }
  } catch (error) {
    console.error("[PubSubHubbub] Unsubscription error:", error)
    return { success: false, error: "Unsubscription request failed" }
  }
}
