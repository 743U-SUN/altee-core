'use server'

import { PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { initializeStorage } from '@/lib/storage-init'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'

// MinIO接続とファイル操作のServer Actions

export async function initStorageAction() {
  console.log('Initializing storage...')
  return await initializeStorage()
}

export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, message: 'No file provided' }
    }

    // ファイル情報
    const fileName = file.name
    const fileType = file.type
    const fileSize = file.size
    
    // アップロード先のキーを決定（uploads/フォルダに保存）
    const key = `uploads/${fileName}`
    
    // ファイルをBufferに変換
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // MinIOにアップロード
    await storageClient.send(new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: fileType,
      ContentLength: fileSize,
    }))
    
    console.log(`File uploaded: ${key}`)
    return { 
      success: true, 
      message: `File uploaded successfully: ${fileName}`,
      fileName,
      key,
      size: fileSize,
      type: fileType
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return { 
      success: false, 
      message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

export async function listFiles() {
  try {
    const response = await storageClient.send(new ListObjectsV2Command({
      Bucket: STORAGE_BUCKET,
      Prefix: 'uploads/', // uploadsフォルダのファイルのみ取得
    }))
    
    const files = response.Contents?.map(object => ({
      key: object.Key || '',
      name: object.Key?.replace('uploads/', '') || '',
      size: object.Size || 0,
      lastModified: object.LastModified?.toISOString() || '',
    })).filter(file => file.name && file.name !== '.keep') || [] // .keepファイルは除外
    
    console.log(`Files listed: ${files.length} files found`)
    return { 
      success: true, 
      files,
      message: `Found ${files.length} files` 
    }
  } catch (error) {
    console.error('List files failed:', error)
    return { 
      success: false, 
      files: [],
      message: `List files failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

export async function deleteFile() {
  // TODO: 実装予定 - filenameパラメータは実装時に追加
  console.log('deleteFile called')
  return { success: false, message: 'Not implemented yet' }
}