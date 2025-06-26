"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// ユーザーデータ作成・更新用のスキーマ
const userDataSchema = z.object({
  icon: z.string().min(1, "アイコンを選択してください"),
  field: z.string()
    .min(1, "項目名を入力してください")
    .max(50, "項目名は50文字以内で入力してください"),
  value: z.string()
    .min(1, "値を入力してください")
    .max(200, "値は200文字以内で入力してください"),
  isVisible: z.boolean().default(true),
})

// データ並び替え用のスキーマ
const reorderUserDataSchema = z.object({
  dataIds: z.array(z.string()).min(1, "並び替えるデータが必要です"),
})

// ユーザーデータを作成
export async function createUserData(data: z.infer<typeof userDataSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // バリデーション
    const validatedData = userDataSchema.parse(data)

    // 30個制限チェック
    const existingDataCount = await prisma.userData.count({
      where: { userId: session.user.id }
    })

    if (existingDataCount >= 30) {
      return { success: false, error: "データは最大30個まで設定できます" }
    }

    // 最大sortOrderを取得
    const maxSortOrder = await prisma.userData.aggregate({
      where: { userId: session.user.id },
      _max: { sortOrder: true }
    })

    const newSortOrder = (maxSortOrder._max.sortOrder || 0) + 1

    // データを作成
    const userData = await prisma.userData.create({
      data: {
        userId: session.user.id,
        icon: validatedData.icon,
        field: validatedData.field,
        value: validatedData.value,
        isVisible: validatedData.isVisible,
        sortOrder: newSortOrder,
      }
    })

    revalidatePath("/dashboard/userdata")
    return { success: true, data: userData }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "データの作成に失敗しました" }
  }
}

// ユーザーデータを更新
export async function updateUserData(dataId: string, data: Partial<z.infer<typeof userDataSchema>>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 部分バリデーション
    const validatedData = userDataSchema.partial().parse(data)

    // 自分のデータかどうかチェック
    const existingData = await prisma.userData.findFirst({
      where: { id: dataId, userId: session.user.id }
    })

    if (!existingData) {
      return { success: false, error: "データが見つかりません" }
    }

    // データを更新
    const userData = await prisma.userData.update({
      where: { id: dataId },
      data: validatedData
    })

    revalidatePath("/dashboard/userdata")
    return { success: true, data: userData }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "データの更新に失敗しました" }
  }
}

// ユーザーデータを削除
export async function deleteUserData(dataId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    // 自分のデータかどうかチェック
    const existingData = await prisma.userData.findFirst({
      where: { id: dataId, userId: session.user.id }
    })

    if (!existingData) {
      return { success: false, error: "データが見つかりません" }
    }

    // データを削除
    await prisma.userData.delete({
      where: { id: dataId }
    })

    revalidatePath("/dashboard/userdata")
    return { success: true }

  } catch {
    return { success: false, error: "データの削除に失敗しました" }
  }
}

// ユーザーのデータ一覧を取得
export async function getUserData(userId?: string) {
  try {
    const session = await auth()
    const targetUserId = userId || session?.user?.id

    if (!targetUserId) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    const userData = await prisma.userData.findMany({
      where: { 
        userId: targetUserId,
        // 自分のデータでない場合は visible のみ表示
        ...(userId && userId !== session?.user?.id ? { isVisible: true } : {})
      },
      orderBy: { sortOrder: "asc" }
    })

    return { success: true, data: userData }

  } catch {
    return { success: false, error: "データの取得に失敗しました" }
  }
}

// データの並び替え
export async function reorderUserData(data: z.infer<typeof reorderUserDataSchema>) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です" }
    }

    const validatedData = reorderUserDataSchema.parse(data)

    // すべてのデータが自分のものかチェック
    const userData = await prisma.userData.findMany({
      where: { 
        id: { in: validatedData.dataIds },
        userId: session.user.id 
      }
    })

    if (userData.length !== validatedData.dataIds.length) {
      return { success: false, error: "無効なデータが含まれています" }
    }

    // トランザクションで並び順を更新
    await prisma.$transaction(
      validatedData.dataIds.map((dataId, index) =>
        prisma.userData.update({
          where: { id: dataId },
          data: { sortOrder: index }
        })
      )
    )

    revalidatePath("/dashboard/userdata")
    return { success: true }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: "入力データが無効です: " + error.errors.map(e => e.message).join(", ")
      }
    }

    return { success: false, error: "データの並び替えに失敗しました" }
  }
}