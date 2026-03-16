"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  basicInfoSchema,
  activitySettingsSchema,
  gameSettingsSchema,
  collabSettingsSchema,
} from "@/lib/validations/character"

function formatZodError(error: z.ZodError): string {
  return "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
}

// キャラクター情報を取得（platformAccounts を include）
export async function getCharacterInfo() {
  const session = await requireAuth()
  try {
    const characterInfo = await prisma.characterInfo.findUnique({
      where: { userId: session.user.id },
      include: {
        platformAccounts: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })

    return { success: true, data: characterInfo }
  } catch {
    return { success: false, error: "キャラクター情報の取得に失敗しました" }
  }
}

// 基本情報の更新
export async function updateBasicInfo(data: z.infer<typeof basicInfoSchema>) {
  const session = await requireAuth()
  try {
    const validated = basicInfoSchema.parse(data)

    const updateData = {
      iconImageKey: validated.iconImageKey ?? null,
      characterName: validated.characterName ?? null,
      nameReading: validated.nameReading ?? null,
      gender: validated.gender ?? null,
      birthdayMonth: validated.birthdayMonth ?? null,
      birthdayDay: validated.birthdayDay ?? null,
      species: validated.species ?? null,
      element: validated.element ?? null,
      debutDate: validated.debutDate ? new Date(validated.debutDate) : null,
      fanName: validated.fanName ?? null,
      fanMark: validated.fanMark ?? null,
      illustrator: validated.illustrator ?? null,
      modeler: validated.modeler ?? null,
      affiliationType: validated.affiliationType ?? null,
      affiliation: validated.affiliation ?? null,
    }

    await prisma.characterInfo.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        ...updateData,
      },
    })

    revalidatePath("/dashboard/character")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) }
    }
    return { success: false, error: "基本情報の更新に失敗しました" }
  }
}

// 活動情報の更新（platformAccounts の upsert + 配信設定の更新）
export async function updateActivitySettings(data: z.infer<typeof activitySettingsSchema>) {
  const session = await requireAuth()
  try {
    const validated = activitySettingsSchema.parse(data)

    await prisma.$transaction(async (tx) => {
      // 1. CharacterInfo を upsert（配信設定フィールド）
      const characterInfo = await tx.characterInfo.upsert({
        where: { userId: session.user.id },
        update: {
          streamingStyles: validated.streamingStyles,
          streamingTimezones: validated.streamingTimezones,
          streamingFrequency: validated.streamingFrequency ?? null,
          languages: validated.languages,
          activityStatus: validated.activityStatus ?? null,
        },
        create: {
          userId: session.user.id,
          streamingStyles: validated.streamingStyles,
          streamingTimezones: validated.streamingTimezones,
          streamingFrequency: validated.streamingFrequency ?? null,
          languages: validated.languages,
          activityStatus: validated.activityStatus ?? null,
        },
      })

      // 2. 既存の platformAccounts を全削除して再作成
      await tx.characterPlatformAccount.deleteMany({
        where: { characterId: characterInfo.id },
      })

      // アクティブなプラットフォームのみ作成
      const activeAccounts = validated.platformAccounts.filter(a => a.isActive)
      if (activeAccounts.length > 0) {
        await tx.characterPlatformAccount.createMany({
          data: activeAccounts.map((account, index) => ({
            characterId: characterInfo.id,
            platform: account.platform,
            url: account.url ?? null,
            isActive: true,
            sortOrder: index,
          })),
        })
      }
    })

    revalidatePath("/dashboard/character/activity")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) }
    }
    return { success: false, error: "活動情報の更新に失敗しました" }
  }
}

// ゲーム設定の更新
export async function updateGameSettings(data: z.infer<typeof gameSettingsSchema>) {
  const session = await requireAuth()
  try {
    const validated = gameSettingsSchema.parse(data)

    await prisma.characterInfo.upsert({
      where: { userId: session.user.id },
      update: {
        gamePlatforms: validated.gamePlatforms,
        gameGenres: validated.gameGenres,
        nowPlaying: validated.nowPlaying ?? null,
      },
      create: {
        userId: session.user.id,
        gamePlatforms: validated.gamePlatforms,
        gameGenres: validated.gameGenres,
        nowPlaying: validated.nowPlaying ?? null,
      },
    })

    revalidatePath("/dashboard/character/game")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) }
    }
    return { success: false, error: "ゲーム設定の更新に失敗しました" }
  }
}

// コラボ設定の更新
export async function updateCollabSettings(data: z.infer<typeof collabSettingsSchema>) {
  const session = await requireAuth()
  try {
    const validated = collabSettingsSchema.parse(data)

    await prisma.characterInfo.upsert({
      where: { userId: session.user.id },
      update: {
        collabStatus: validated.collabStatus ?? null,
        collabComment: validated.collabComment ?? null,
      },
      create: {
        userId: session.user.id,
        collabStatus: validated.collabStatus ?? null,
        collabComment: validated.collabComment ?? null,
      },
    })

    revalidatePath("/dashboard/character/collab")
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: formatZodError(error) }
    }
    return { success: false, error: "コラボ設定の更新に失敗しました" }
  }
}
