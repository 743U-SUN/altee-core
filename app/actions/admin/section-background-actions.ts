'use server'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateCssString } from '@/lib/sections/background-utils'
import {
  presetInputSchema,
  cuidSchema,
  type PresetInput,
} from '@/lib/validations/section-settings'

// ===== 一覧取得 =====

export async function getPresetsAction() {
  try {
    await requireAdmin()

    const presets = await prisma.sectionBackgroundPreset.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return { success: true as const, data: presets }
  } catch (error) {
    console.error('Failed to fetch presets:', error)
    return { success: false as const, error: 'プリセットの取得に失敗しました' }
  }
}

// ===== 詳細取得 =====

export async function getPresetByIdAction(id: string) {
  try {
    await requireAdmin()

    const validatedId = cuidSchema.parse(id)

    const preset = await prisma.sectionBackgroundPreset.findUnique({
      where: { id: validatedId },
    })

    if (!preset) {
      return { success: false, error: 'プリセットが見つかりませんでした' }
    }

    return { success: true as const, data: preset }
  } catch (error) {
    console.error('Failed to fetch preset:', error)
    if (error instanceof z.ZodError) {
      return { success: false as const, error: '無効なIDフォーマットです' }
    }
    return { success: false as const, error: 'プリセットの取得に失敗しました' }
  }
}

// ===== 作成 =====

export async function createPresetAction(input: PresetInput) {
  try {
    await requireAdmin()

    const validated = presetInputSchema.parse(input)

    // cssString をconfig から自動生成
    const cssString = generateCssString(
      validated.category,
      validated.config as Parameters<typeof generateCssString>[1]
    )

    const preset = await prisma.sectionBackgroundPreset.create({
      data: {
        name: validated.name,
        category: validated.category,
        config: validated.config,
        cssString: cssString || null,
        isActive: validated.isActive,
        sortOrder: validated.sortOrder,
      },
    })

    revalidatePath('/admin/section-backgrounds')
    return { success: true as const, data: preset }
  } catch (error) {
    console.error('Failed to create preset:', error)
    if (error instanceof z.ZodError) {
      return { success: false as const, error: error.errors[0].message }
    }
    return { success: false as const, error: 'プリセットの作成に失敗しました' }
  }
}

// ===== 更新 =====

export async function updatePresetAction(id: string, input: PresetInput) {
  try {
    await requireAdmin()

    const validatedId = cuidSchema.parse(id)
    const validated = presetInputSchema.parse(input)

    const existing = await prisma.sectionBackgroundPreset.findUnique({
      where: { id: validatedId },
    })

    if (!existing) {
      return { success: false, error: 'プリセットが見つかりませんでした' }
    }

    // cssString をconfig から自動生成
    const cssString = generateCssString(
      validated.category,
      validated.config as Parameters<typeof generateCssString>[1]
    )

    const preset = await prisma.sectionBackgroundPreset.update({
      where: { id: validatedId },
      data: {
        name: validated.name,
        category: validated.category,
        config: validated.config,
        cssString: cssString || null,
        isActive: validated.isActive,
        sortOrder: validated.sortOrder,
      },
    })

    revalidatePath('/admin/section-backgrounds')
    return { success: true as const, data: preset }
  } catch (error) {
    console.error('Failed to update preset:', error)
    if (error instanceof z.ZodError) {
      return { success: false as const, error: error.errors[0].message }
    }
    return { success: false as const, error: 'プリセットの更新に失敗しました' }
  }
}

// ===== 削除 =====

export async function deletePresetAction(id: string) {
  try {
    await requireAdmin()

    const validatedId = cuidSchema.parse(id)

    const existing = await prisma.sectionBackgroundPreset.findUnique({
      where: { id: validatedId },
    })

    if (!existing) {
      return { success: false, error: 'プリセットが見つかりませんでした' }
    }

    await prisma.sectionBackgroundPreset.delete({
      where: { id: validatedId },
    })

    revalidatePath('/admin/section-backgrounds')
    revalidatePath('/', 'layout')
    return { success: true as const }
  } catch (error) {
    console.error('Failed to delete preset:', error)
    if (error instanceof z.ZodError) {
      return { success: false as const, error: '無効なIDフォーマットです' }
    }
    return { success: false as const, error: 'プリセットの削除に失敗しました' }
  }
}

// ===== isActive トグル =====

export async function togglePresetActiveAction(id: string, isActive: boolean) {
  try {
    await requireAdmin()

    const validatedId = cuidSchema.parse(id)

    await prisma.sectionBackgroundPreset.update({
      where: { id: validatedId },
      data: { isActive },
    })

    revalidatePath('/admin/section-backgrounds')
    revalidatePath('/', 'layout')
    return { success: true as const }
  } catch (error) {
    console.error('Failed to toggle preset active:', error)
    if (error instanceof z.ZodError) {
      return { success: false as const, error: '無効なIDフォーマットです' }
    }
    return { success: false as const, error: '更新に失敗しました' }
  }
}

// ===== sortOrder 一括更新 =====

export async function updatePresetSortOrderAction(
  items: { id: string; sortOrder: number }[]
) {
  try {
    await requireAdmin()

    await prisma.$transaction(
      items.map((item) =>
        prisma.sectionBackgroundPreset.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    )

    revalidatePath('/admin/section-backgrounds')
    return { success: true as const }
  } catch (error) {
    console.error('Failed to update sort order:', error)
    return { success: false as const, error: '並び替えに失敗しました' }
  }
}
