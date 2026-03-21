"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { cuidSchema } from "@/lib/validations/shared"

const emailSchema = z.string().email().max(254)

/**
 * ブラックリスト登録済みメールアドレスの一覧を取得
 */
export async function getBlacklistedEmails() {
  await requireAdmin()

  try {
    const blacklistedEmails = await prisma.blacklistedEmail.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        reason: true,
        createdAt: true,
      },
    })

    return blacklistedEmails
  } catch {
    throw new Error("ブラックリストの取得に失敗しました")
  }
}

/**
 * メールアドレスをブラックリストに追加
 */
export async function addBlacklistedEmail(email: string, reason?: string) {
  await requireAdmin()

  // バリデーション
  const parseResult = emailSchema.safeParse(email)
  if (!parseResult.success) {
    throw new Error("有効なメールアドレスを入力してください")
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    // 既に存在するかチェック
    const existing = await prisma.blacklistedEmail.findUnique({
      where: { email: normalizedEmail },
    })

    if (existing) {
      throw new Error("このメールアドレスは既にブラックリストに登録されています")
    }

    // ブラックリストに追加
    const blacklistedEmail = await prisma.blacklistedEmail.create({
      data: {
        email: normalizedEmail,
        reason: reason?.trim() || null,
      },
    })

    return blacklistedEmail
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("ブラックリストへの追加に失敗しました")
  }
}

/**
 * ブラックリストからメールアドレスを削除
 */
export async function removeBlacklistedEmail(id: string) {
  await requireAdmin()

  const validatedId = cuidSchema.parse(id)

  try {
    // 存在するかチェック
    const existing = await prisma.blacklistedEmail.findUnique({
      where: { id: validatedId },
      select: { email: true },
    })

    if (!existing) {
      throw new Error("削除対象のメールアドレスが見つかりません")
    }

    // ブラックリストから削除
    await prisma.blacklistedEmail.delete({
      where: { id: validatedId },
    })

    return { success: true, deletedEmail: existing.email }
  } catch (error) {
    if (error instanceof Error && error.message.includes("削除対象の")) {
      throw error
    }
    throw new Error("ブラックリストからの削除に失敗しました")
  }
}

/**
 * 一括でメールアドレスをブラックリストに追加（CSV形式）
 */
export async function addBlacklistedEmailsBulk(
  emails: string[],
  reason?: string
) {
  await requireAdmin()

  if (!emails || emails.length === 0) {
    throw new Error("追加するメールアドレスが指定されていません")
  }

  // 最大100件までの制限
  if (emails.length > 100) {
    throw new Error("一度に追加できるメールアドレスは100件までです")
  }

  const normalizedEmails = emails
    .map(email => email.toLowerCase().trim())
    .filter(email => emailSchema.safeParse(email).success)

  if (normalizedEmails.length === 0) {
    throw new Error("有効なメールアドレスがありません")
  }

  try {
    // 既存のブラックリストをチェック
    const existingEmails = await prisma.blacklistedEmail.findMany({
      where: {
        email: { in: normalizedEmails },
      },
      select: { email: true },
    })

    const existingEmailSet = new Set(existingEmails.map(e => e.email))
    const newEmails = normalizedEmails.filter(email => !existingEmailSet.has(email))

    if (newEmails.length === 0) {
      throw new Error("すべてのメールアドレスが既にブラックリストに登録されています")
    }

    // 一括追加
    const blacklistedEmails = await prisma.blacklistedEmail.createMany({
      data: newEmails.map(email => ({
        email,
        reason: reason?.trim() || null,
      })),
    })

    return {
      success: true,
      addedCount: blacklistedEmails.count,
      skippedCount: normalizedEmails.length - newEmails.length,
      totalProcessed: normalizedEmails.length,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("一括追加に失敗しました")
  }
}

/**
 * メールアドレスがブラックリストに登録されているかチェック
 */
export async function checkEmailBlacklisted(email: string) {
  await requireAdmin()

  const parseResult = emailSchema.safeParse(email)
  if (!parseResult.success) {
    throw new Error("有効なメールアドレスを入力してください")
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const blacklistedEmail = await prisma.blacklistedEmail.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        reason: true,
        createdAt: true,
      },
    })

    return {
      isBlacklisted: !!blacklistedEmail,
      details: blacklistedEmail,
    }
  } catch {
    throw new Error("ブラックリストチェックに失敗しました")
  }
}