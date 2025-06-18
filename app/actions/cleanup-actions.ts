'use server'

import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { storageClient } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// 管理者権限チェック
async function requireAdminAuth() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error('管理者権限が必要です')
  }
  return session
}

// 全コンテナのファイル一覧を取得
export async function getAllStorageFiles() {
  await requireAdminAuth()
  
  const containers = ['article-thumbnails', 'article-images', 'images']
  const allFiles: Array<{
    container: string
    key: string
    size: number
    lastModified: string
    storageKey: string
  }> = []
  
  try {
    for (const container of containers) {
      const command = new ListObjectsV2Command({
        Bucket: container,
        MaxKeys: 1000
      })
      
      const response = await storageClient.send(command)
      
      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key) {
            allFiles.push({
              container,
              key: obj.Key,
              size: obj.Size || 0,
              lastModified: obj.LastModified?.toISOString() || '',
              storageKey: `${container}/${obj.Key}`
            })
          }
        }
      }
    }
    
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
  await requireAdminAuth()
  
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
  await requireAdminAuth()
  
  const deletedFiles: string[] = []
  const errors: string[] = []
  
  try {
    for (const storageKey of orphanKeys) {
      try {
        const [container, ...keyParts] = storageKey.split('/')
        const objectKey = keyParts.join('/')
        
        await storageClient.send(new DeleteObjectCommand({
          Bucket: container,
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
  await requireAdminAuth()
  
  try {
    const orphanResult = await detectOrphanFiles()
    const storageResult = await getAllStorageFiles()
    
    if (!orphanResult.success || !storageResult.success) {
      throw new Error('統計データの取得に失敗しました')
    }
    
    // 孤立ファイルの合計サイズを計算
    const orphanTotalSize = orphanResult.orphans.reduce((sum, file) => sum + file.size, 0)
    
    return {
      success: true,
      stats: {
        storageFiles: storageResult.count,
        dbFiles: orphanResult.dbTotal || 0,
        orphanFiles: orphanResult.count,
        orphanSizeMB: Math.round(orphanTotalSize / 1024 / 1024 * 100) / 100,
        containers: {
          'article-thumbnails': storageResult.files.filter(f => f.container === 'article-thumbnails').length,
          'article-images': storageResult.files.filter(f => f.container === 'article-images').length,
          'images': storageResult.files.filter(f => f.container === 'images').length
        }
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