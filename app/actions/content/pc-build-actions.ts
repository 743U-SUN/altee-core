'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { revalidatePath, updateTag } from 'next/cache'
import { after } from 'next/server'
import { normalizeHandle } from '@/lib/validations/shared'
import { z } from 'zod'
import { pcBuildSchema, pcPartSchema, PC_PART_TYPES } from '@/lib/validations/pc-build'
import { checkBuildCompatibility, type PartWithSpecs } from '@/lib/pc-compatibility'
import type { PcBuildInput, PcPartInput } from '@/lib/validations/pc-build'
import type { ItemWithPcPartSpec } from '@/types/pc-part-spec'

// ===== 入力バリデーションスキーマ =====

const searchCatalogSchema = z.object({
  query: z.string().max(100, '検索クエリは100文字以内にしてください'),
  partType: z.enum(PC_PART_TYPES).optional(),
})

const handleSchema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/, '不正なハンドルです')

const reorderSchema = z.array(z.string().cuid()).max(50, 'パーツ数の上限を超えています')

// ===== 互換性チェック =====

/**
 * ユーザーのビルドの互換性をチェック
 */
export async function checkUserBuildCompatibility() {
  const session = await requireAuth()
  const userId = session.user.id
  try {
    const pcBuild = await prisma.userPcBuild.findUnique({
      where: { userId },
      include: {
        parts: {
          include: {
            item: {
              include: {
                pcPartSpec: true,
              },
            },
          },
        },
      },
    })

    if (!pcBuild) {
      return { success: false, error: 'PCビルドが見つかりませんでした' }
    }

    // PcPartSpec を持つパーツのみチェック対象
    const partsWithSpecs: PartWithSpecs[] = pcBuild.parts
      .filter((part) => part.item?.pcPartSpec)
      .map((part) => ({
        partType: part.partType,
        name: part.name,
        specs: part.item!.pcPartSpec!.specs as Record<string, unknown>,
        tdp: part.item!.pcPartSpec!.tdp,
      }))

    const result = checkBuildCompatibility(partsWithSpecs)
    return { success: true, data: result }
  } catch {
    return { success: false, error: '互換性チェックに失敗しました' }
  }
}

// ===== カタログ検索 =====

/**
 * PCパーツカタログから検索（認証不要・読み取り専用）
 */
export async function searchPcPartCatalog(query: string, partType?: string): Promise<{ success: boolean; data?: ItemWithPcPartSpec[]; error?: string }> {
  try {
    const validated = searchCatalogSchema.parse({ query, partType })
    const items = await prisma.item.findMany({
      where: {
        AND: [
          {
            category: {
              itemType: 'PC_PART',
              ...(validated.partType ? { slug: validated.partType.toLowerCase() } : {}),
            },
          },
          validated.query
            ? {
                OR: [
                  { name: { contains: validated.query, mode: 'insensitive' } },
                  { brand: { name: { contains: validated.query, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: {
        brand: true,
        category: true,
        pcPartSpec: true,
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return { success: true, data: items }
  } catch {
    return { success: false, error: 'カタログ検索に失敗しました' }
  }
}

// ===== ヘルパー =====

function revalidateUserPaths(handle: string | null | undefined) {
  after(() => {
    revalidatePath('/dashboard/items')
    if (handle) {
      revalidatePath(`/@${handle}/items`)
    }
  })
}

// ===== 公開ページ用 =====

/**
 * ハンドルからユーザーの公開PCビルドを取得
 */
export async function getPublicPcBuildByHandle(handle: string) {
  try {
    const validatedHandle = handleSchema.parse(handle)

    // リレーション経由の単一クエリで取得
    const pcBuild = await prisma.userPcBuild.findFirst({
      where: {
        user: { handle: validatedHandle },
        isPublic: true,
      },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            item: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
      },
    })

    return { success: true, data: pcBuild }
  } catch {
    return { success: false, error: 'PCビルドの取得に失敗しました' }
  }
}

// ===== ダッシュボード用 =====

/**
 * 認証済みユーザー自身のPCビルドを取得
 */
export async function getUserPcBuild() {
  const session = await requireAuth()
  const userId = session.user.id
  try {
    const pcBuild = await prisma.userPcBuild.findUnique({
      where: { userId },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            item: {
              include: {
                brand: true,
                category: true,
              },
            },
          },
        },
      },
    })

    return { success: true, data: pcBuild }
  } catch {
    return { success: false, error: 'PCビルドの取得に失敗しました' }
  }
}

/**
 * PCビルド情報をupsert（作成または更新）
 */
export async function upsertUserPcBuild(data: PcBuildInput) {
  const session = await requireAuth()
  const userId = session.user.id
  try {
    const validated = pcBuildSchema.parse(data)

    const pcBuild = await prisma.userPcBuild.upsert({
      where: { userId },
      create: {
        userId,
        name: validated.name,
        imageKey: validated.imageKey,
        description: validated.description,
        totalBudget: validated.totalBudget,
        isPublic: validated.isPublic,
      },
      update: {
        name: validated.name,
        imageKey: validated.imageKey,
        description: validated.description,
        totalBudget: validated.totalBudget,
        isPublic: validated.isPublic,
      },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }
    revalidateUserPaths(session.user.handle)

    return { success: true, data: pcBuild }
  } catch {
    return { success: false, error: 'PCビルドの保存に失敗しました' }
  }
}

/**
 * PCパーツを追加
 */
export async function addPcBuildPart(data: PcPartInput) {
  const session = await requireAuth()
  const userId = session.user.id
  try {
    const validated = pcPartSchema.parse(data)

    const part = await prisma.$transaction(async (tx) => {
      // PCビルドを取得（なければ作成）
      let pcBuild = await tx.userPcBuild.findUnique({
        where: { userId },
      })

      if (!pcBuild) {
        pcBuild = await tx.userPcBuild.create({
          data: { userId },
        })
      }

      // 現在の最大sortOrderを取得
      const maxSortOrder = await tx.userPcBuildPart.findFirst({
        where: { buildId: pcBuild.id },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })

      return tx.userPcBuildPart.create({
        data: {
          buildId: pcBuild.id,
          partType: validated.partType,
          name: validated.name,
          price: validated.price,
          amazonUrl: validated.amazonUrl,
          memo: validated.memo,
          sortOrder: validated.sortOrder ?? (maxSortOrder?.sortOrder ?? -1) + 1,
          itemId: validated.itemId || null,
        },
      })
    })

    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }
    revalidateUserPaths(session.user.handle)

    return { success: true, data: part }
  } catch {
    return { success: false, error: 'パーツの追加に失敗しました' }
  }
}

/**
 * PCパーツを更新
 */
export async function updatePcBuildPart(partId: string, data: PcPartInput) {
  const session = await requireAuth()
  const userId = session.user.id
  try {
    const validatedPartId = z.string().cuid().parse(partId)
    const validated = pcPartSchema.parse(data)

    // 所有権確認
    const part = await prisma.userPcBuildPart.findUnique({
      where: { id: validatedPartId },
      include: { build: { select: { userId: true } } },
    })

    if (!part || part.build.userId !== userId) {
      return { success: false, error: 'パーツが見つかりませんでした' }
    }

    const updated = await prisma.userPcBuildPart.update({
      where: { id: validatedPartId },
      data: {
        partType: validated.partType,
        name: validated.name,
        price: validated.price,
        amazonUrl: validated.amazonUrl,
        memo: validated.memo,
        itemId: validated.itemId || null,
      },
    })

    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }
    revalidateUserPaths(session.user.handle)

    return { success: true, data: updated }
  } catch {
    return { success: false, error: 'パーツの更新に失敗しました' }
  }
}

/**
 * PCパーツを削除
 */
export async function deletePcBuildPart(partId: string) {
  const session = await requireAuth()
  const userId = session.user.id
  try {
    const validatedPartId = z.string().cuid().parse(partId)

    // 所有権確認
    const part = await prisma.userPcBuildPart.findUnique({
      where: { id: validatedPartId },
      include: { build: { select: { userId: true } } },
    })

    if (!part || part.build.userId !== userId) {
      return { success: false, error: 'パーツが見つかりませんでした' }
    }

    await prisma.userPcBuildPart.delete({ where: { id: validatedPartId } })

    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }
    revalidateUserPaths(session.user.handle)

    return { success: true }
  } catch {
    return { success: false, error: 'パーツの削除に失敗しました' }
  }
}

/**
 * PCパーツの並び順を更新
 */
export async function reorderPcBuildParts(partIds: string[]) {
  const session = await requireAuth()
  const userId = session.user.id
  try {
    const validatedIds = reorderSchema.parse(partIds)
    // ユーザーのビルドの全パーツIDを取得して所有権を検証
    const userBuild = await prisma.userPcBuild.findUnique({
      where: { userId },
      include: { parts: { select: { id: true } } },
    })

    if (!userBuild) {
      return { success: false, error: '権限がありません' }
    }

    const ownedPartIds = new Set(userBuild.parts.map((p) => p.id))
    const allOwned = validatedIds.every((id) => ownedPartIds.has(id))

    if (!allOwned) {
      return { success: false, error: '権限がありません' }
    }

    await prisma.$transaction(
      validatedIds.map((id, index) =>
        prisma.userPcBuildPart.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    if (session.user.handle) {
      const h = normalizeHandle(session.user.handle)
      updateTag(`items-${h}`)
    }
    revalidateUserPaths(session.user.handle)

    return { success: true }
  } catch {
    return { success: false, error: 'パーツの並び替えに失敗しました' }
  }
}
