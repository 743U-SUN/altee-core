'use server'

import { ListObjectsV2Command, DeleteObjectCommand, type ListObjectsV2CommandOutput } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

// 全ストレージファイル一覧を取得（単一バケット構造に対応）
export async function getAllStorageFiles() {
  await requireAdmin()

  const allFiles: Array<{
    container: string
    key: string
    size: number
    lastModified: string
    storageKey: string
  }> = []

  try {
    // Cloudflare R2では単一バケット内の全ファイルを取得
    let continuationToken: string | undefined = undefined

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: STORAGE_BUCKET,
        MaxKeys: 1000,
        ContinuationToken: continuationToken
      })

      const result: ListObjectsV2CommandOutput = await storageClient.send(command)

      if (result.Contents) {
        for (const obj of result.Contents) {
          if (obj.Key) {
            // Key形式: "folder/YYYY/MM/filename.ext"
            // const folder = obj.Key.split('/')[0] || 'unknown'
            allFiles.push({
              container: STORAGE_BUCKET,
              key: obj.Key,
              size: obj.Size || 0,
              lastModified: obj.LastModified?.toISOString() || '',
              storageKey: `${STORAGE_BUCKET}/${obj.Key}`
            })
          }
        }
      }

      continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined
    } while (continuationToken)

    return {
      success: true,
      files: allFiles,
      count: allFiles.length
    }
  } catch (error) {
    console.error('Storage files fetch error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      files: [],
      count: 0
    }
  }
}

// 孤立ファイルを検出
export async function detectOrphanFiles() {
  await requireAdmin()
  
  try {
    // 1. ストレージの全ファイル取得
    const storageResult = await getAllStorageFiles()
    if (!storageResult.success) {
      return {
        success: false,
        error: storageResult.error,
        orphans: [],
        count: 0
      }
    }
    
    // 2. DBの全ファイル取得（論理削除含む - 孤立ファイル検出には全てが必要）
    const allDbFiles = await prisma.mediaFile.findMany({
      select: { storageKey: true, id: true }
    })
    
    // 3. 孤立ファイルを特定（DBに記録のないストレージファイル）
    const orphanFiles = storageResult.files.filter(storageFile => 
      !allDbFiles.some(dbFile => dbFile.storageKey === storageFile.storageKey)
    )
    
    return {
      success: true,
      orphans: orphanFiles,
      count: orphanFiles.length,
      storageTotal: storageResult.count,
      dbTotal: allDbFiles.length
    }
  } catch (error) {
    console.error('Orphan detection error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      orphans: [],
      count: 0
    }
  }
}

// 孤立ファイルを削除
export async function cleanupOrphanFiles(orphanKeys: string[]) {
  await requireAdmin()

  const deletedFiles: string[] = []
  const errors: string[] = []

  try {
    for (const storageKey of orphanKeys) {
      try {
        // storageKeyの形式を判定して適切なBucketとKeyを決定
        let bucket: string
        let objectKey: string

        if (storageKey.startsWith('altee-images/')) {
          // 新形式: "altee-images/folder/YYYY/MM/filename.ext"
          // Bucket: altee-images
          // Key: folder/YYYY/MM/filename.ext
          const [bucketPart, ...keyParts] = storageKey.split('/')
          bucket = bucketPart
          objectKey = keyParts.join('/')
        } else {
          // 旧形式（ConoHa時代）: "folder/YYYY/MM/filename.ext"
          // Bucket: altee-images（現在のバケット）
          // Key: folder/YYYY/MM/filename.ext（全体をKeyとして使用）
          bucket = STORAGE_BUCKET
          objectKey = storageKey
        }

        await storageClient.send(new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey
        }))

        deletedFiles.push(storageKey)
      } catch (error) {
        const errorMsg = `${storageKey}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
      }
    }

    return {
      success: true,
      deletedCount: deletedFiles.length,
      deletedFiles,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    console.error('Orphan cleanup error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      deletedCount: 0,
      deletedFiles: [],
      errors: undefined
    }
  }
}

// 削除統計を取得
export async function getDeletionStats() {
  await requireAdmin()

  try {
    // detectOrphanFiles内部でgetAllStorageFilesを呼ぶため重複クエリを回避
    const orphanResult = await detectOrphanFiles()

    if (!orphanResult.success) {
      throw new Error('統計データの取得に失敗しました')
    }

    // 孤立ファイルの合計サイズを計算
    const orphanTotalSize = orphanResult.orphans.reduce((sum, file) => sum + file.size, 0)

    // フォルダ別統計
    const folderStats: Record<string, number> = {}
    for (const file of orphanResult.orphans) {
      const folder = file.key.split('/')[0] || 'unknown'
      folderStats[folder] = (folderStats[folder] || 0) + 1
    }

    return {
      success: true,
      stats: {
        storageFiles: orphanResult.storageTotal || 0,
        dbFiles: orphanResult.dbTotal || 0,
        orphanFiles: orphanResult.count,
        orphanSizeMB: Math.round(orphanTotalSize / 1024 / 1024 * 100) / 100,
        folders: folderStats
      }
    }
  } catch (error) {
    console.error('Deletion stats error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: null
    }
  }
}