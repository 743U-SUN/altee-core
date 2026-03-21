'use server'

import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { requireAuth } from '@/lib/auth'
import type { CustomIcon } from '@/app/actions/admin/icon-actions'

/**
 * 認証済みユーザー用カスタムアイコン取得（admin不要）
 * アイコンセレクター等で使用
 */
export async function getPublicCustomIcons(): Promise<{
  success: boolean
  icons?: CustomIcon[]
  error?: string
}> {
  await requireAuth()

  try {

    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        containerName: 'admin-icons',
        uploadType: 'ICON',
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        originalName: true,
        fileName: true,
        storageKey: true,
        description: true,
        tags: true,
      },
    })

    const icons: CustomIcon[] = mediaFiles.map((file) => ({
      id: file.id,
      name: file.fileName.replace(/\.[^.]+$/, ''),
      originalName: file.originalName,
      url: getPublicUrl(file.storageKey),
      tags: Array.isArray(file.tags) ? (file.tags as string[]) : [],
      description: file.description || undefined,
    }))

    return { success: true, icons }
  } catch {
    return { success: false, error: 'カスタムアイコンの取得に失敗しました' }
  }
}
