import 'server-only'

/**
 * YouTube PubSubHubbub サービス
 * YouTube の新着動画通知を受け取るためのサブスクリプション管理
 */

type PubSubResult = {
  success: boolean
  message?: string
  error?: string
}

/**
 * PubSubHubbub 共通処理
 */
async function managePubSubSubscription(
  channelId: string,
  mode: 'subscribe' | 'unsubscribe'
): Promise<PubSubResult> {
  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/youtube`
    const topicUrl = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
    const hubUrl = "https://pubsubhubbub.appspot.com/subscribe"

    const params: Record<string, string> = {
      "hub.callback": callbackUrl,
      "hub.topic": topicUrl,
      "hub.mode": mode,
      "hub.verify": "async",
    }

    if (mode === 'subscribe') {
      params["hub.lease_seconds"] = "864000" // 10 days
    }

    // webhook署名検証用のシークレットを送信
    const webhookSecret = process.env.YOUTUBE_WEBHOOK_SECRET
    if (webhookSecret) {
      params["hub.secret"] = webhookSecret
    }

    const formData = new URLSearchParams(params)

    const response = await fetch(hubUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    })

    if (response.status === 202) {
      return { success: true, message: `${mode} request sent successfully` }
    } else {
      return { success: false, error: `${mode} failed: ${response.status}` }
    }
  } catch {
    return { success: false, error: `${mode} request failed` }
  }
}

/**
 * YouTube PubSubHubbub に subscribe
 */
export async function subscribeToYoutubePush(channelId: string): Promise<PubSubResult> {
  return managePubSubSubscription(channelId, 'subscribe')
}

/**
 * YouTube PubSubHubbub から unsubscribe
 */
export async function unsubscribeFromYoutubePush(channelId: string): Promise<PubSubResult> {
  return managePubSubSubscription(channelId, 'unsubscribe')
}
