'use server'

import { requireAuth, cachedAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import type { UserSection, SectionSettings } from '@/types/profile-sections'
import { nanoid } from 'nanoid'
import { SECTION_REGISTRY } from '@/lib/sections'
import { deleteImageAction } from '@/app/actions/media/image-upload-actions'
import { sectionSettingsSchema } from '@/lib/validations/section-settings'
import { unsubscribeFromYoutubePush } from '@/services/youtube/youtube-pubsubhubbub'
import { cuidSchema, cuidArraySchema } from '@/lib/validations/shared'

const VALID_PAGES = ['profile', 'videos'] as const
type SectionPage = (typeof VALID_PAGES)[number]

function isValidPage(page: string): page is SectionPage {
  return (VALID_PAGES as readonly string[]).includes(page)
}

/**
 * ユーザーのセクションを取得（ページ別フィルタ対応）
 */
export async function getUserSections(
  userId: string,
  page: string = 'profile'
): Promise<UserSection[] | null> {
  try {
    if (!isValidPage(page)) {

      return null
    }

    // 認証状態を確認し、非オーナーには isVisible: true のみ返す
    const session = await cachedAuth()
    const isOwner = session?.user?.id === userId

    const sections = await prisma.userSection.findMany({
      where: {
        userId,
        page,
        ...(!isOwner && { isVisible: true }),
      },
      orderBy: { sortOrder: 'asc' },
    })

    return sections as UserSection[]
  } catch {
    return null
  }
}

/**
 * セクションデータから画像キーを抽出（削除クリーンアップ用）
 */
function extractImageKeys(sectionType: string, data: unknown): string[] {
  if (!data || typeof data !== 'object') return []
  const d = data as Record<string, unknown>

  switch (sectionType) {
    case 'profile-card':
      return d.avatarImageKey ? [d.avatarImageKey as string] : []
    case 'weekly-schedule':
      return d.imageKey ? [d.imageKey as string] : []
    case 'image': {
      const keys: string[] = []
      if (d.imageKey) keys.push(d.imageKey as string)
      const bg = d.background as Record<string, unknown> | undefined
      if (bg?.imageKey) keys.push(bg.imageKey as string)
      return keys
    }
    case 'image-hero': {
      const item = d.item as Record<string, unknown> | undefined
      return item?.imageKey ? [item.imageKey as string] : []
    }
    case 'image-grid-2':
    case 'image-grid-3': {
      const items = d.items as Array<Record<string, unknown>> | undefined
      if (!items) return []
      return items
        .filter((item) => item.imageKey)
        .map((item) => item.imageKey as string)
    }
    default:
      return []
  }
}

/**
 * セクションタイプに応じたサンプルデータを生成
 */
function generateSampleData(sectionType: string, providedData: unknown): unknown {
  // データが既に提供されている場合はそれを使用
  if (providedData && typeof providedData === 'object') {
    const dataObj = providedData as Record<string, unknown>
    // questions または items が空でない場合はそのまま使用
    if (Array.isArray(dataObj.questions) && dataObj.questions.length > 0) {
      return providedData
    }
    if (Array.isArray(dataObj.items) && dataObj.items.length > 0) {
      return providedData
    }
  }

  // セクションタイプに応じたサンプルデータを生成
  switch (sectionType) {
    case 'faq':
      return {
        questions: [
          {
            id: nanoid(),
            question: 'サンプルの質問です',
            answer: 'サンプルの回答です。編集ボタンから内容を変更できます。',
            iconName: 'HelpCircle',
            sortOrder: 0,
          },
        ],
      }

    case 'links':
      return {
        items: [
          {
            id: nanoid(),
            url: 'https://example.com',
            title: 'サンプルリンク',
            iconType: 'preset',
            iconKey: undefined,
            customIconUrl: undefined,
            sortOrder: 0,
          },
        ],
      }

    case 'icon-links':
      return {
        items: [
          {
            id: nanoid(),
            url: 'https://example.com',
            platform: 'サンプル',
            iconType: 'lucide',
            lucideIconName: 'Link',
            sortOrder: 0,
          },
        ],
      }

    case 'link-list':
      return {
        items: [
          {
            id: nanoid(),
            url: 'https://example.com',
            title: 'サンプルリンク',
            description: '説明文',
            iconType: 'lucide',
            lucideIconName: 'ExternalLink',
            sortOrder: 0,
          },
        ],
      }

    case 'bar-graph':
      return {
        items: [
          {
            id: nanoid(),
            label: 'サンプルスキル',
            value: 80,
            maxValue: 100,
            sortOrder: 0,
          },
        ],
      }

    case 'circular-stat':
      return {
        items: [
          { id: nanoid(), value: 80, centerChar: 'A', iconName: 'Zap', label: 'STR', color: '#f87171', sortOrder: 0 },
          { id: nanoid(), value: 95, centerChar: 'S', iconName: 'Star', label: 'INT', subLabel: 'MAX', color: '#60a5fa', sortOrder: 1 },
          { id: nanoid(), value: 45, centerChar: 'C', iconName: 'Heart', label: 'VIT', color: '#4ade80', sortOrder: 2 },
        ],
      }

    case 'weekly-schedule': {
      const today = new Date()
      const yyyy = today.getFullYear()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const dd = String(today.getDate()).padStart(2, '0')
      return {
        startDate: `${yyyy}-${mm}-${dd}`,
        schedules: ['', '', '', '', '', '', ''],
      }
    }

    default:
      return providedData
  }
}

/**
 * 新しいセクションを作成
 */
export async function createSection(
  userId: string,
  sectionType: string,
  data: unknown = {},
  page: string = 'profile'
): Promise<{ success: boolean; error?: string; section?: UserSection }> {
  try {
    const session = await requireAuth()
    if (session.user.id !== userId) {
      return { success: false, error: '権限がありません' }
    }

    // page バリデーション
    if (!isValidPage(page)) {
      return { success: false, error: '無効なページです' }
    }

    // sectionType ホワイトリスト検証
    const definition = SECTION_REGISTRY[sectionType]
    if (!definition) {

      return { success: false, error: '無効なセクションタイプです' }
    }

    // sectionType と page の整合性チェック
    const expectedPage = definition.page ?? 'profile'
    if (expectedPage !== page) {
      return { success: false, error: 'セクションタイプとページが一致しません' }
    }

    // 同一ページ内での最大sortOrderを取得
    const maxSortOrder = await prisma.userSection.findFirst({
      where: { userId, page },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const sortOrder = (maxSortOrder?.sortOrder ?? -1) + 1

    // サンプルデータを生成
    const sectionData = generateSampleData(sectionType, data)

    const section = await prisma.userSection.create({
      data: {
        userId,
        sectionType,
        page,
        sortOrder,
        data: sectionData as never,
        settings: definition?.defaultSettings
          ? (definition.defaultSettings as never)
          : undefined,
      },
    })

    revalidatePath(`/@${session.user.handle}`)

    return { success: true, section: section as UserSection }
  } catch (error) {

    return { success: false, error: 'セクションの作成に失敗しました' }
  }
}

/**
 * セクションのデータを更新
 */
export async function updateSection(
  sectionId: string,
  data: Partial<{ title: string | null; isVisible: boolean; data: unknown }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth()
    const validatedSectionId = cuidSchema.parse(sectionId)

    // セクションの所有者確認
    const section = await prisma.userSection.findUnique({
      where: { id: validatedSectionId },
      select: { userId: true, page: true },
    })

    if (!section || section.userId !== session.user.id) {
      return { success: false, error: '権限がありません' }
    }

    // data.data の基本構造バリデーション
    if (data.data !== undefined) {
      if (typeof data.data !== 'object' || data.data === null || Array.isArray(data.data)) {
        return { success: false, error: 'セクションデータの形式が不正です' }
      }
    }

    await prisma.userSection.update({
      where: { id: validatedSectionId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        ...(data.data !== undefined && { data: data.data as never }),
      },
    })

    revalidatePath(`/@${session.user.handle}`)
    if (section.page === 'videos') {
      revalidatePath('/dashboard/videos')
    }

    return { success: true }
  } catch (error) {

    return { success: false, error: 'セクションの更新に失敗しました' }
  }
}

/**
 * セクションを削除
 */
export async function deleteSection(
  sectionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth()
    const validatedSectionId = cuidSchema.parse(sectionId)

    // セクションの所有者確認 + データ取得（画像クリーンアップ用）
    const section = await prisma.userSection.findUnique({
      where: { id: validatedSectionId },
      select: { userId: true, sectionType: true, data: true },
    })

    if (!section || section.userId !== session.user.id) {
      return { success: false, error: '権限がありません' }
    }

    // 画像クリーンアップ（失敗してもセクション削除は続行）
    const imageKeys = extractImageKeys(section.sectionType, section.data)
    if (imageKeys.length > 0) {
      await Promise.allSettled(imageKeys.map((key) => deleteImageAction(key)))
    }

    // youtube-latest セクション削除時に PubSubHubbub の unsubscribe を実行
    if (section.sectionType === 'youtube-latest') {
      const sectionData = section.data as Record<string, unknown> | null
      const channelId = sectionData?.channelId as string | undefined
      if (channelId) {
        await unsubscribeFromYoutubePush(channelId).catch(() => {
          // unsubscribe失敗は無視
        })
      }
    }

    await prisma.userSection.delete({
      where: { id: validatedSectionId },
    })

    revalidatePath(`/@${session.user.handle}`)

    return { success: true }
  } catch (error) {

    return { success: false, error: 'セクションの削除に失敗しました' }
  }
}

/**
 * セクションの並び順を更新
 */
export async function reorderSections(
  sectionIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await requireAuth()
  const validatedIds = cuidArraySchema.parse(sectionIds)

  try {
    // 全セクションの所有者確認
    const sections = await prisma.userSection.findMany({
      where: { id: { in: validatedIds } },
      select: { id: true, userId: true },
    })

    if (
      sections.length !== validatedIds.length ||
      sections.some((s) => s.userId !== session.user.id)
    ) {
      return { success: false, error: '権限がありません' }
    }

    // トランザクションで一括更新
    await prisma.$transaction(
      validatedIds.map((id, index) =>
        prisma.userSection.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    )

    revalidatePath(`/@${session.user.handle}`)

    return { success: true }
  } catch (error) {

    return { success: false, error: 'セクションの並び替えに失敗しました' }
  }
}

/**
 * セクションのスタイル設定（背景・パディング）を更新
 */
export async function updateSectionSettings(
  sectionId: string,
  settings: SectionSettings | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth()
    const validatedSectionId = cuidSchema.parse(sectionId)

    // 入力バリデーション
    if (settings !== null) {
      const parsed = sectionSettingsSchema.safeParse(settings)
      if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message }
      }
    }

    // セクションの所有者確認
    const section = await prisma.userSection.findUnique({
      where: { id: validatedSectionId },
      select: { userId: true },
    })

    if (!section || section.userId !== session.user.id) {
      return { success: false, error: '権限がありません' }
    }

    await prisma.userSection.update({
      where: { id: validatedSectionId },
      data: { settings: settings as never },
    })

    revalidatePath(`/@${session.user.handle}`)

    return { success: true }
  } catch (error) {

    return { success: false, error: 'セクション設定の更新に失敗しました' }
  }
}

/**
 * セクションを1つずつ上下に移動（▲▼ボタン用）
 */
export async function moveSectionOrder(
  sectionId: string,
  direction: 'up' | 'down'
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth()
    const validatedSectionId = cuidSchema.parse(sectionId)

    // セクションの所有者確認と現在の情報を取得
    const section = await prisma.userSection.findUnique({
      where: { id: validatedSectionId },
      select: { userId: true, sortOrder: true, page: true },
    })

    if (!section || section.userId !== session.user.id) {
      return { success: false, error: '権限がありません' }
    }

    // 同一ページ内のセクションのみ取得
    const allSections = await prisma.userSection.findMany({
      where: { userId: session.user.id, page: section.page },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, sortOrder: true },
    })

    const currentIndex = allSections.findIndex((s) => s.id === validatedSectionId)
    if (currentIndex === -1) {
      return { success: false, error: 'セクションが見つかりません' }
    }

    // 移動先のインデックスを計算
    const targetIndex =
      direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // 範囲外チェック
    if (targetIndex < 0 || targetIndex >= allSections.length) {
      return { success: false, error: '移動できません' }
    }

    // 入れ替え
    const targetSection = allSections[targetIndex]
    await prisma.$transaction([
      prisma.userSection.update({
        where: { id: validatedSectionId },
        data: { sortOrder: targetSection.sortOrder },
      }),
      prisma.userSection.update({
        where: { id: targetSection.id },
        data: { sortOrder: section.sortOrder },
      }),
    ])

    revalidatePath(`/@${session.user.handle}`)

    return { success: true }
  } catch (error) {

    return { success: false, error: 'セクションの移動に失敗しました' }
  }
}
