import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { prisma } from "@/lib/prisma"
import { revalidateTag } from "next/cache"

// Twitch EventSub メッセージタイプ
const MESSAGE_TYPE_VERIFICATION = "webhook_callback_verification"
const MESSAGE_TYPE_NOTIFICATION = "notification"
const MESSAGE_TYPE_REVOCATION = "revocation"

// Twitch EventSub Webhook 署名検証
function verifyTwitchSignature(
  request: NextRequest,
  body: string
): boolean {
  const secret = process.env.TWITCH_WEBHOOK_SECRET
  if (!secret) {
    console.error("[Twitch EventSub] TWITCH_WEBHOOK_SECRET is not set")
    return false
  }

  const messageId = request.headers.get("twitch-eventsub-message-id")
  const timestamp = request.headers.get("twitch-eventsub-message-timestamp")
  const signature = request.headers.get("twitch-eventsub-message-signature")

  if (!messageId || !timestamp || !signature) {
    console.error("[Twitch EventSub] Missing required headers")
    return false
  }

  // タイムスタンプチェック（Replay攻撃防止）
  const timestampDate = new Date(timestamp)
  const now = new Date()
  const timeDiff = Math.abs(now.getTime() - timestampDate.getTime())
  const tenMinutes = 10 * 60 * 1000

  if (timeDiff > tenMinutes) {
    console.error("[Twitch EventSub] Timestamp is too old")
    return false
  }

  // HMAC-SHA256 署名検証
  const message = messageId + timestamp + body
  const hmac = createHmac("sha256", secret)
  hmac.update(message)
  const expectedSignature = "sha256=" + hmac.digest("hex")

  return signature === expectedSignature
}

// POST: Twitch EventSub 通知を受信
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // 署名検証
    if (!verifyTwitchSignature(request, body)) {
      console.error("[Twitch EventSub] Signature verification failed")
      return new NextResponse("Forbidden", { status: 403 })
    }

    const payload = JSON.parse(body)
    const messageType = request.headers.get("twitch-eventsub-message-type")

    console.log("[Twitch EventSub] Received message:", {
      type: messageType,
      subscriptionType: payload.subscription?.type,
    })

    // Challenge 検証（初回登録時）
    if (messageType === MESSAGE_TYPE_VERIFICATION) {
      const challenge = payload.challenge
      console.log("[Twitch EventSub] Responding to challenge")
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    }

    // Subscription 取り消し通知
    if (messageType === MESSAGE_TYPE_REVOCATION) {
      const subscriptionId = payload.subscription?.id
      console.log(`[Twitch EventSub] Subscription revoked: ${subscriptionId}`)

      // データベースから削除
      await prisma.twitchEventSubSubscription.deleteMany({
        where: { subscriptionId },
      })

      return new NextResponse("OK", { status: 200 })
    }

    // イベント通知
    if (messageType === MESSAGE_TYPE_NOTIFICATION) {
      const eventType = payload.subscription?.type
      const event = payload.event

      console.log("[Twitch EventSub] Event notification:", {
        type: eventType,
        broadcasterUserId: event?.broadcaster_user_id,
      })

      // stream.online: ライブ配信開始
      if (eventType === "stream.online") {
        const broadcasterId = event.broadcaster_user_id
        const streamId = event.id
        const streamTitle = event.title || ""
        const viewerCount = event.viewer_count || 0
        const startedAt = new Date(event.started_at)

        // ユーザーを検索
        const user = await prisma.user.findFirst({
          where: { twitchUserId: broadcasterId },
        })

        if (!user) {
          console.log(`[Twitch EventSub] No user found with twitchUserId: ${broadcasterId}`)
          return new NextResponse("OK", { status: 200 })
        }

        // TwitchLiveStatus を更新（upsert）
        await prisma.twitchLiveStatus.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            isLive: true,
            streamId,
            streamTitle,
            viewerCount,
            startedAt,
            lastCheckedAt: new Date(),
          },
          update: {
            isLive: true,
            streamId,
            streamTitle,
            viewerCount,
            startedAt,
            lastCheckedAt: new Date(),
          },
        })

        // キャッシュ無効化
        if (user.handle) {
          revalidateTag(`user-${user.handle}`, 'max')
          console.log(`[Twitch EventSub] Invalidated cache for user ${user.handle}`)
        }

        console.log(`[Twitch EventSub] Updated live status for user ${user.id}: LIVE`)
      }

      // stream.offline: ライブ配信終了
      if (eventType === "stream.offline") {
        const broadcasterId = event.broadcaster_user_id

        // ユーザーを検索
        const user = await prisma.user.findFirst({
          where: { twitchUserId: broadcasterId },
        })

        if (!user) {
          console.log(`[Twitch EventSub] No user found with twitchUserId: ${broadcasterId}`)
          return new NextResponse("OK", { status: 200 })
        }

        // TwitchLiveStatus を更新
        await prisma.twitchLiveStatus.updateMany({
          where: { userId: user.id },
          data: {
            isLive: false,
            streamId: null,
            streamTitle: null,
            streamThumbnail: null,
            viewerCount: null,
            startedAt: null,
            lastCheckedAt: new Date(),
          },
        })

        // キャッシュ無効化
        if (user.handle) {
          revalidateTag(`user-${user.handle}`, 'max')
          console.log(`[Twitch EventSub] Invalidated cache for user ${user.handle}`)
        }

        console.log(`[Twitch EventSub] Updated live status for user ${user.id}: OFFLINE`)
      }

      return new NextResponse("OK", { status: 200 })
    }

    return new NextResponse("Bad Request", { status: 400 })
  } catch (error) {
    console.error("[Twitch EventSub] Error processing notification:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
