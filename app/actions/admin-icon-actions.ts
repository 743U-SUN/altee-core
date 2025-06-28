'use server'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export interface CustomIcon {
  id: string
  name: string
  originalName: string
  url: string
  tags: string[]
  description?: string
}

/**
 * admin-iconsコンテナのカスタムアイコン一覧を取得
 */
export async function getCustomIcons(tags?: string[]): Promise<{
  success: boolean
  icons?: CustomIcon[]
  error?: string
}> {
  try {
    // 認証チェック（必要に応じて）
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    const where: {
      containerName: string
      uploadType: 'ICON'
      deletedAt: null
      tags?: {
        path: string
        array_contains: string[]
      }
    } = {
      containerName: 'admin-icons',
      uploadType: 'ICON',
      deletedAt: null
    }

    // タグフィルタリング
    if (tags && tags.length > 0) {
      where.tags = {
        path: '$[*]',
        array_contains: tags
      }
    }

    const mediaFiles = await prisma.mediaFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        fileName: true,
        storageKey: true,
        description: true,
        tags: true,
      }
    })

    const icons: CustomIcon[] = mediaFiles.map(file => ({
      id: file.id,
      name: file.fileName.replace(/\.[^.]+$/, ''), // 拡張子を除去
      originalName: file.originalName,
      url: `/api/files/${file.storageKey}`,
      tags: Array.isArray(file.tags) ? file.tags as string[] : [],
      description: file.description || undefined,
    }))

    return { success: true, icons }
  } catch (error) {
    console.error('Failed to fetch custom icons:', error)
    return { success: false, error: 'カスタムアイコンの取得に失敗しました' }
  }
}

/**
 * 使用可能なタグ一覧を取得
 */
export async function getIconTags(): Promise<{
  success: boolean
  tags?: string[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // admin-iconsのすべてのタグを取得
    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        containerName: 'admin-icons',
        uploadType: 'ICON',
        deletedAt: null,
        tags: { not: Prisma.DbNull }
      },
      select: {
        tags: true,
      }
    })

    // すべてのタグを展開してユニークな配列を作成
    const allTags = new Set<string>()
    mediaFiles.forEach(file => {
      if (Array.isArray(file.tags)) {
        (file.tags as string[]).forEach(tag => {
          if (typeof tag === 'string' && tag.trim()) {
            allTags.add(tag.trim())
          }
        })
      }
    })

    const tags = Array.from(allTags).sort()
    return { success: true, tags }
  } catch (error) {
    console.error('Failed to fetch icon tags:', error)
    return { success: false, error: 'タグの取得に失敗しました' }
  }
}