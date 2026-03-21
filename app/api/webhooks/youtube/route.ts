import { NextRequest, NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"
import { revalidateTag } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createHmac, timingSafeEqual } from "crypto"

/**
 * YouTube PubSubHubbub HMAC署名検証
 */
function verifyYoutubeSignature(request: NextRequest, body: string): boolean {
  const secret = process.env.YOUTUBE_WEBHOOK_SECRET
  if (!secret) {
    return false
  }

  const signature = request.headers.get('x-hub-signature')
  if (!signature) return false

  const [algo, hash] = signature.split('=')
  if (algo !== 'sha1' || !hash) return false

  const hmac = createHmac('sha1', secret)
  hmac.update(body)
  const expectedHash = hmac.digest('hex')

  const sigBuf = Buffer.from(hash)
  const expectedBuf = Buffer.from(expectedHash)
  if (sigBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(sigBuf, expectedBuf)
}

// GET: YouTube PubSubHubbub Hub verification (challenge response)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const topic = searchParams.get("hub.topic")
  const challenge = searchParams.get("hub.challenge")

  // Verify that this is a subscription confirmation
  if (mode === "subscribe" && challenge) {
    // Extract channel ID from topic URL and verify it's registered
    const channelMatch = topic?.match(/channel_id=([^&]+)/)
    const channelId = channelMatch?.[1]

    if (!channelId) {
      return new NextResponse("Bad Request", { status: 400 })
    }

    // Verify the channel is registered by a user in our system
    const user = await prisma.user.findFirst({
      where: { youtubeChannelId: channelId },
      select: { id: true },
    })

    if (!user) {
      return new NextResponse("Not Found", { status: 404 })
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

    // HMAC署名検証
    if (!verifyYoutubeSignature(request, body)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Parse Atom XML feed
    const parser = new XMLParser({ ignoreAttributes: false })
    const result = parser.parse(body)

    // Extract video information from Atom feed
    const entry = result.feed?.entry
    if (!entry) {
      return new NextResponse("OK", { status: 200 })
    }

    const channelId = entry["yt:channelId"]

    // Find users with this YouTube channel
    const users = await prisma.user.findMany({
      where: { youtubeChannelId: channelId },
      select: { id: true, handle: true },
    })

    if (users.length === 0) {
      return new NextResponse("OK", { status: 200 })
    }

    // Invalidate RSS Feed cache for this channel
    revalidateTag(`youtube-${channelId}`, 'max')

    // Optionally invalidate user profile pages
    for (const user of users) {
      if (user.handle) {
        revalidateTag(`user-${user.handle}`, 'max')
      }
    }

    return new NextResponse("OK", { status: 200 })
  } catch {
    // Return 200 even on error to prevent YouTube from retrying
    return new NextResponse("OK", { status: 200 })
  }
}
