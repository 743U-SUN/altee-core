import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
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
    return false
  }

  const messageId = request.headers.get("twitch-eventsub-message-id")
  const timestamp = request.headers.get("twitch-eventsub-message-timestamp")
  const signature = request.headers.get("twitch-eventsub-message-signature")

  if (!messageId || !timestamp || !signature) {
    return false
  }

  // タイムスタンプチェック（Replay攻撃防止）
  const timestampDate = new Date(timestamp)
  const now = new Date()
  const timeDiff = Math.abs(now.getTime() - timestampDate.getTime())
  const tenMinutes = 10 * 60 * 1000

  if (timeDiff > tenMinutes) {
    return false
  }

  // HMAC-SHA256 署名検証
  const message = messageId + timestamp + body
  const hmac = createHmac("sha256", secret)
  hmac.update(message)
  const expectedSignature = "sha256=" + hmac.digest("hex")

  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expectedSignature)
  if (sigBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(sigBuf, expectedBuf)
}

// POST: Twitch EventSub 通知を受信
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // 署名検証
    if (!verifyTwitchSignature(request, body)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const payload = JSON.parse(body)
    const messageType = request.headers.get("twitch-eventsub-message-type")

    // Challenge 検証（初回登録時）
    if (messageType === MESSAGE_TYPE_VERIFICATION) {
      const challenge = payload.challenge
      return new NextResponse(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      })
    }

    // Subscription 取り消し通知
    if (messageType === MESSAGE_TYPE_REVOCATION) {
      const subscriptionId = payload.subscription?.id

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
        }
      }

      // stream.offline: ライブ配信終了
      if (eventType === "stream.offline") {
        const broadcasterId = event.broadcaster_user_id

        // ユーザーを検索
        const user = await prisma.user.findFirst({
          where: { twitchUserId: broadcasterId },
        })

        if (!user) {
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
        }
      }

      return new NextResponse("OK", { status: 200 })
    }

    return new NextResponse("Bad Request", { status: 400 })
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
