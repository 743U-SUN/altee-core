import { CreateBucketCommand, HeadBucketCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from './storage'

/**
 * バケットの存在確認
 */
async function bucketExists(): Promise<boolean> {
  try {
    await storageClient.send(new HeadBucketCommand({ Bucket: STORAGE_BUCKET }))
    return true
  } catch {
    return false
  }
}

/**
 * バケット作成
 */
async function createBucket(): Promise<void> {
  await storageClient.send(new CreateBucketCommand({ Bucket: STORAGE_BUCKET }))
  console.log(`Bucket created: ${STORAGE_BUCKET}`)
}

/**
 * ディレクトリ構造作成（空の.keepファイルで疑似フォルダ作成）
 */
async function createDirectoryStructure(): Promise<void> {
  const directories = [
    'articles/published/',
    'articles/drafts/',
    'images/thumbnails/',
    'images/originals/',
    'documents/',
    'uploads/',
    'temp/'
  ]

  for (const dir of directories) {
    await storageClient.send(new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: `${dir}.keep`,
      Body: '',
      ContentType: 'text/plain'
    }))
  }
  
  console.log('Directory structure created')
}

/**
 * ストレージ初期化（バケット作成 + ディレクトリ構造作成）
 */
export async function initializeStorage(): Promise<{ success: boolean; message: string }> {
  try {
    // バケットが存在するかチェック
    if (await bucketExists()) {
      console.log(`Bucket already exists: ${STORAGE_BUCKET}`)
      return { success: true, message: 'Storage already initialized' }
    }

    // バケット作成
    await createBucket()
    
    // ディレクトリ構造作成
    await createDirectoryStructure()
    
    return { success: true, message: 'Storage initialized successfully' }
  } catch (error) {
    console.error('Storage initialization failed:', error)
    return { 
      success: false, 
      message: `Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}