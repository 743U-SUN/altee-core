"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getTwitchUserId, createTwitchEventSub, deleteTwitchEventSub, getTwitchEventSubStatus } from "@/services/twitch/twitch-api"

const TWITCH_USERNAME_PATTERN = /^[a-zA-Z0-9_]{4,25}$/

// =============================================================================
// バリデーションスキーマ
// =============================================================================

// Twitchチャンネル設定スキーマ
const twitchChannelSchema = z.object({
  username: z.string().regex(TWITCH_USERNAME_PATTERN, "有効なTwitch Usernameではありません"),
})

// ライブ優先度設定スキーマ
const livePrioritySchema = z.enum(["youtube", "twitch"])

// =============================================================================
// Twitch チャンネル設定
// =============================================================================

/**
 * Twitchチャンネル設定を更新
 */
export async function updateTwitchChannel(data: z.infer<typeof twitchChannelSchema>) {
  try {
    const session = await requireAuth()

    const validatedData = twitchChannelSchema.parse(data)

    // Twitch User IDを取得
    const userIdResult = await getTwitchUserId(validatedData.username)
    if (!userIdResult.success || !userIdResult.userId) {
      return { success: false, error: userIdResult.error || "Twitch User IDの取得に失敗しました" }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        twitchUsername: validatedData.username,
        twitchUserId: userIdResult.userId,
      },
    })

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true, data: { twitchUserId: userIdResult.userId } }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("Twitchチャンネル更新エラー:", error)
    return { success: false, error: "Twitchチャンネル設定の更新に失敗しました" }
  }
}

/**
 * ライブ配信優先度設定を更新
 */
export async function updateLivePriority(priority: z.infer<typeof livePrioritySchema>) {
  try {
    const session = await requireAuth()

    const validatedPriority = livePrioritySchema.parse(priority)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        livePriority: validatedPriority,
      },
    })

    revalidatePath("/dashboard/platforms")
    revalidatePath(`/[handle]`, "page")

    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    console.error("ライブ優先度更新エラー:", error)
    return { success: false, error: "ライブ優先度設定の更新に失敗しました" }
  }
}

// =============================================================================
// Twitch EventSub 管理
// =============================================================================

/**
 * Twitch EventSub Subscriptionを作成
 */
export async function createTwitchEventSubSubscription(twitchUserId: string) {
  try {
    const session = await requireAuth()

    return await createTwitchEventSub(twitchUserId, session.user.id)
  } catch (error) {
    console.error("EventSub作成エラー:", error)
    return { success: false, error: "EventSubの作成に失敗しました" }
  }
}

/**
 * Twitch EventSub Subscriptionを削除
 */
export async function deleteTwitchEventSubSubscription() {
  try {
    const session = await requireAuth()

    return await deleteTwitchEventSub(session.user.id)
  } catch (error) {
    console.error("EventSub削除エラー:", error)
    return { success: false, error: "EventSubの削除に失敗しました" }
  }
}

/**
 * Twitch EventSub Subscriptionのステータスを取得
 */
export async function getTwitchEventSubSubscriptionStatus() {
  try {
    const session = await requireAuth()

    return await getTwitchEventSubStatus(session.user.id)
  } catch (error) {
    console.error("EventSubステータス取得エラー:", error)
    return { success: false, isSubscribed: false, error: "ステータスの取得に失敗しました" }
  }
}

// =============================================================================
// データ取得
// =============================================================================

/**
 * ユーザーのTwitch設定を取得
 */
export async function getUserTwitchSettings() {
  try {
    const session = await requireAuth()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        twitchUsername: true,
        twitchUserId: true,
        livePriority: true,
      },
    })

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error("Twitch設定取得エラー:", error)
    return { success: false, error: "Twitch設定の取得に失敗しました" }
  }
}
