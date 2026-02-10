import { NextRequest, NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"

// GET: YouTube PubSubHubbub Hub verification (challenge response)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const topic = searchParams.get("hub.topic")
  const challenge = searchParams.get("hub.challenge")
  const leaseSeconds = searchParams.get("hub.lease_seconds")

  console.log("[YouTube Webhook] Hub verification request:", {
    mode,
    topic,
    challenge,
    leaseSeconds,
  })

  // Verify that this is a subscription confirmation
  if (mode === "subscribe" && challenge) {
    // Extract channel ID from topic URL
    const channelMatch = topic?.match(/channel_id=([^&]+)/)
    const channelId = channelMatch?.[1]

    if (channelId) {
      console.log(`[YouTube Webhook] Verified subscription for channel: ${channelId}`)
      console.log(`[YouTube Webhook] Lease expires in ${leaseSeconds} seconds`)
    }

    // Return the challenge to confirm subscription
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    })
  }

  return new NextResponse("Bad Request", { status: 400 })
}

// POST: Receive new video notifications from YouTube
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    console.log("[YouTube Webhook] Received notification")

    // Parse Atom XML feed
    const parser = new XMLParser({ ignoreAttributes: false })
    const result = parser.parse(body)

    // Extract video information from Atom feed
    const entry = result.feed?.entry
    if (!entry) {
      console.log("[YouTube Webhook] No entry found in notification")
      return new NextResponse("OK", { status: 200 })
    }

    const videoId = entry["yt:videoId"]
    const channelId = entry["yt:channelId"]
    const title = entry.title
    const published = entry.published

    console.log("[YouTube Webhook] New video notification:", {
      videoId,
      channelId,
      title,
      published,
    })

    // Find users with this YouTube channel
    const users = await prisma.user.findMany({
      where: { youtubeChannelId: channelId },
      select: { id: true, handle: true },
    })

    if (users.length === 0) {
      console.log(`[YouTube Webhook] No users found with channel ${channelId}`)
      return new NextResponse("OK", { status: 200 })
    }

    // Invalidate RSS Feed cache for this channel
    revalidateTag(`youtube-${channelId}`, 'max')
    console.log(`[YouTube Webhook] Invalidated cache for channel ${channelId}`)

    // Optionally invalidate user profile pages
    for (const user of users) {
      if (user.handle) {
        revalidateTag(`user-${user.handle}`, 'max')
        console.log(`[YouTube Webhook] Invalidated cache for user ${user.handle}`)
      }
    }

    return new NextResponse("OK", { status: 200 })
  } catch (error) {
    console.error("[YouTube Webhook] Error processing notification:", error)
    // Return 200 even on error to prevent YouTube from retrying
    return new NextResponse("OK", { status: 200 })
  }
}
