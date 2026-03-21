'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'
import { requireAdmin } from '@/lib/auth'
import { cuidArraySchema } from '@/lib/validations/shared'
import { storageClient } from '@/lib/storage'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { MediaType } from '@prisma/client'
import { parseStorageKey } from '@/lib/utils/storage-key'

export interface MediaFilesFilter {
  containerName?: string
  uploadType?: MediaType
  search?: string
  tags?: string // タグ検索（カンマ区切り）
  month?: string // YYYY/MM format
  page?: number
  limit?: number
}

export async function getMediaFiles(filter: MediaFilesFilter = {}) {
  await requireAdmin()

  const { containerName, uploadType, search, tags, month, page = 1, limit = 20 } = filter
  const skip = (page - 1) * limit

  const where: {
    containerName?: string
    uploadType?: MediaType
    deletedAt?: null
    OR?: Array<{
      originalName?: { contains: string; mode: 'insensitive' }
      fileName?: { contains: string; mode: 'insensitive' }
    }>
    tags?: {
      path: string
      array_contains: string[]
    }
    storageKey?: { contains: string }
  } = {
    deletedAt: null // 論理削除されていないファイルのみ
  }

  if (containerName) {
    where.containerName = containerName
  }

  if (uploadType) {
    where.uploadType = uploadType
  }

  if (search) {
    where.OR = [
      { originalName: { contains: search, mode: 'insensitive' } },
      { fileName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (tags) {
    // タグ検索：カンマ区切りの各タグを含むファイルを検索
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    if (tagArray.length > 0) {
      where.tags = {
        path: '$[*]',
        array_contains: tagArray
      }
    }
  }

  if (month) {
    // storageKeyが "container/YYYY/MM/filename" 形式の場合の月別フィルタリング
    where.storageKey = {
      contains: month // "2024/01" のような形式で検索
    }
  }

  const [mediaFiles, total] = await Promise.all([
    prisma.mediaFile.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        articles: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.mediaFile.count({ where }),
  ])

  // publicUrlを追加したメディアファイル
  const mediaFilesWithUrl = mediaFiles.map(file => ({
    ...file,
    publicUrl: getPublicUrl(file.storageKey),
  }))

  return {
    mediaFiles: mediaFilesWithUrl,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getMediaCount(): Promise<number> {
  await requireAdmin()
  return prisma.mediaFile.count({ where: { deletedAt: null } })
}

export async function getMediaStats() {
  await requireAdmin()

  const [
    totalFiles,
    thumbnailFiles,
    contentFiles,
    containerStats,
    totalSize,
    monthlyStats,
  ] = await Promise.all([
    // 総ファイル数（論理削除除外）
    prisma.mediaFile.count({
      where: { deletedAt: null }
    }),
    
    // サムネイル数（論理削除除外）
    prisma.mediaFile.count({
      where: { uploadType: 'THUMBNAIL', deletedAt: null },
    }),
    
    // コンテンツ画像数（論理削除除外）
    prisma.mediaFile.count({
      where: { uploadType: 'CONTENT', deletedAt: null },
    }),
    
    // コンテナ別統計（論理削除除外）
    prisma.mediaFile.groupBy({
      by: ['containerName'],
      where: { deletedAt: null },
      _count: { id: true },
      _sum: { fileSize: true },
    }),
    
    // 総容量（論理削除除外）
    prisma.mediaFile.aggregate({
      where: { deletedAt: null },
      _sum: { fileSize: true },
    }),
    
    // 月別統計（過去12ヶ月）
    prisma.$queryRaw<Array<{
      month: Date
      count: number
      total_size: bigint
    }>>`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*)::int as count,
        SUM("fileSize")::bigint as total_size
      FROM "media_files" 
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        AND "deletedAt" IS NULL
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `,
  ])

  return {
    totalFiles,
    thumbnailFiles,
    contentFiles,
    totalSize: totalSize._sum.fileSize || 0,
    containerStats: containerStats.map(stat => ({
      containerName: stat.containerName,
      fileCount: stat._count.id,
      totalSize: stat._sum.fileSize || 0,
      warningThreshold: stat._count.id > 500000, // 50万ファイル警告
    })),
    monthlyStats: monthlyStats.map(stat => ({
      month: stat.month.toISOString().slice(0, 7), // YYYY-MM形式
      count: stat.count,
      totalSize: Number(stat.total_size),
    })),
  }
}

export async function deleteMediaFile(fileId: string) {
  const session = await requireAdmin()

  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id: fileId, deletedAt: null },
    include: {
      articles: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  if (!mediaFile) {
    throw new Error('ファイルが見つかりません')
  }

  // 使用状況チェック
  if (mediaFile.articles.length > 0) {
    const articleTitles = mediaFile.articles.map(a => a.title).join(', ')
    throw new Error(`このファイルは以下の記事で使用されています: ${articleTitles}`)
  }

  try {
    const now = new Date()
    const scheduledDeletionAt = new Date(now.getTime() + 5 * 60 * 1000)

    await prisma.mediaFile.update({
      where: { id: fileId },
      data: {
        deletedAt: now,
        deletedBy: session.user.id,
        scheduledDeletionAt: scheduledDeletionAt,
      },
    })

    revalidatePath('/admin/media')
    return { success: true }

  } catch {
    throw new Error('ファイルの削除中にエラーが発生しました')
  }
}

export async function bulkDeleteMediaFiles(fileIds: string[]) {
  const session = await requireAdmin()

  if (fileIds.length === 0) {
    throw new Error('削除するファイルが選択されていません')
  }

  const validatedIds = cuidArraySchema.parse(fileIds)

  if (validatedIds.length > 100) {
    throw new Error('一度に削除できるファイルは最大100件です')
  }

  const mediaFiles = await prisma.mediaFile.findMany({
    where: { id: { in: validatedIds }, deletedAt: null },
    include: {
      articles: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  })

  // 使用中ファイルをチェック
  const usedFiles = mediaFiles.filter(file => file.articles.length > 0)
  if (usedFiles.length > 0) {
    const usedFileNames = usedFiles.map(f => f.originalName).join(', ')
    throw new Error(`以下のファイルは記事で使用されているため削除できません: ${usedFileNames}`)
  }

  try {
    const now = new Date()
    const scheduledDeletionAt = new Date(now.getTime() + 5 * 60 * 1000)

    await prisma.mediaFile.updateMany({
      where: { id: { in: validatedIds } },
      data: {
        deletedAt: now,
        deletedBy: session.user.id,
        scheduledDeletionAt: scheduledDeletionAt,
      },
    })

    revalidatePath('/admin/media')
    return { success: true, deletedCount: validatedIds.length }

  } catch {
    throw new Error('ファイルの一括削除中にエラーが発生しました')
  }
}

// 使用状況確認（特定ファイルがどこで使われているか）
export async function getMediaFileUsage(fileId: string) {
  await requireAdmin()

  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id: fileId },
    include: {
      articles: {
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
        },
      },
    },
  })

  if (!mediaFile) {
    throw new Error('ファイルが見つかりません')
  }

  return {
    mediaFile,
    usage: {
      articlesCount: mediaFile.articles.length,
      articles: mediaFile.articles,
      canDelete: mediaFile.articles.length === 0,
    },
  }
}

// 論理削除されたファイルを復旧
export async function restoreMediaFile(fileId: string) {
  await requireAdmin()

  const mediaFile = await prisma.mediaFile.findUnique({
    where: { id: fileId },
  })

  if (!mediaFile) {
    throw new Error('ファイルが見つかりません')
  }

  if (!mediaFile.deletedAt) {
    throw new Error('このファイルは削除されていません')
  }

  try {
    await prisma.mediaFile.update({
      where: { id: fileId },
      data: {
        deletedAt: null,
        deletedBy: null,
        scheduledDeletionAt: null,
      },
    })

    revalidatePath('/admin/media')
    return { success: true }

  } catch {
    throw new Error('ファイルの復旧中にエラーが発生しました')
  }
}

// 30日経過したファイルを物理削除
export async function cleanupExpiredFiles() {
  await requireAdmin()

  const now = new Date()
  
  // 30日経過したファイルを取得
  const expiredFiles = await prisma.mediaFile.findMany({
    where: {
      deletedAt: { not: null },
      scheduledDeletionAt: { lt: now },
    },
  })

  if (expiredFiles.length === 0) {
    return { success: true, deletedCount: 0, message: '削除対象のファイルはありません' }
  }

  const errors: string[] = []
  const deletedIds: string[] = []

  // ストレージから並列削除（並列度10）
  const CONCURRENCY = 10
  for (let i = 0; i < expiredFiles.length; i += CONCURRENCY) {
    const batch = expiredFiles.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(async (file) => {
        const { bucket, objectKey } = parseStorageKey(file.storageKey)
        await storageClient.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }))
        return file.id
      })
    )

    for (let j = 0; j < results.length; j++) {
      const result = results[j]
      if (result.status === 'fulfilled') {
        deletedIds.push(result.value)
      } else {
        const file = batch[j]
        errors.push(`${file.originalName}: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`)
      }
    }
  }

  // DBから一括削除
  if (deletedIds.length > 0) {
    await prisma.mediaFile.deleteMany({
      where: { id: { in: deletedIds } },
    })
  }

  revalidatePath('/admin/media')

  return {
    success: true,
    deletedCount: deletedIds.length,
    totalFound: expiredFiles.length,
    errors: errors.length > 0 ? errors : null,
    message: `${deletedIds.length}/${expiredFiles.length}件のファイルを物理削除しました`,
  }
}

// 論理削除されたファイル一覧を取得（ゴミ箱機能用）
export async function getDeletedMediaFiles(filter: MediaFilesFilter = {}) {
  await requireAdmin()

  const { containerName, uploadType, search, month, page = 1, limit = 20 } = filter
  const skip = (page - 1) * limit

  const where: {
    containerName?: string
    uploadType?: MediaType
    deletedAt: { not: null }
    OR?: Array<{
      originalName?: { contains: string; mode: 'insensitive' }
      fileName?: { contains: string; mode: 'insensitive' }
    }>
    storageKey?: { contains: string }
  } = {
    deletedAt: { not: null } // 論理削除されたファイルのみ
  }

  if (containerName) {
    where.containerName = containerName
  }

  if (uploadType) {
    where.uploadType = uploadType
  }

  if (search) {
    where.OR = [
      { originalName: { contains: search, mode: 'insensitive' } },
      { fileName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (month) {
    where.storageKey = {
      contains: month
    }
  }

  const [mediaFiles, total] = await Promise.all([
    prisma.mediaFile.findMany({
      where,
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { deletedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.mediaFile.count({ where }),
  ])

  return {
    mediaFiles,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}