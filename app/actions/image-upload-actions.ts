'use server'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'
import type { UploadedFile } from '@/types/image-upload'
import { sanitizeSVGFile } from '@/lib/image-uploader/svg-sanitizer'

/**
 * 画像ファイルをアップロード
 */
export async function uploadImageAction(
  formData: FormData,
  folder: string = 'images'
): Promise<{ success: boolean; file?: UploadedFile; error?: string }> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'ファイルが選択されていません' }
    }

    // ファイル情報
    const fileName = file.name
    const fileType = file.type
    
    // ユニークなファイル名を生成（タイムスタンプ + ランダム文字列）
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = fileName.split('.').pop() || ''
    const uniqueFileName = `${timestamp}_${randomString}.${extension}`
    
    // アップロード先のキーを決定
    const key = `${folder}/${uniqueFileName}`
    
    let processedFile = file
    
    // SVGファイルの場合はサニタイズ
    if (fileType === 'image/svg+xml') {
      const sanitizeResult = await sanitizeSVGFile(file)
      if (!sanitizeResult.success) {
        return { success: false, error: sanitizeResult.error }
      }
      processedFile = sanitizeResult.sanitizedFile!
    }
    
    // ファイルをBufferに変換
    const buffer = Buffer.from(await processedFile.arrayBuffer())
    
    // MinIOにアップロード
    await storageClient.send(new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: processedFile.type,
      ContentLength: processedFile.size,
    }))
    
    // アップロード済みファイル情報を作成
    const uploadedFile: UploadedFile = {
      id: `${timestamp}_${randomString}`,
      name: uniqueFileName,
      originalName: fileName,
      url: `/api/files/${key}`,
      key: key,
      size: processedFile.size,
      type: processedFile.type,
      uploadedAt: new Date().toISOString()
    }
    
    console.log(`Image uploaded: ${key}`)
    return { 
      success: true, 
      file: uploadedFile
    }
    
  } catch (error) {
    console.error('Image upload failed:', error)
    return { 
      success: false, 
      error: `アップロードに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * 複数の画像ファイルを一括アップロード
 */
export async function uploadImagesAction(
  files: File[],
  folder: string = 'images'
): Promise<{ success: boolean; files?: UploadedFile[]; errors?: string[] }> {
  const results = []
  const errors = []
  
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    
    const result = await uploadImageAction(formData, folder)
    if (result.success && result.file) {
      results.push(result.file)
    } else {
      errors.push(result.error || 'Unknown error')
    }
  }
  
  return {
    success: results.length > 0,
    files: results,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * 画像ファイルを削除
 */
export async function deleteImageAction(
  fileKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // MinIOからファイルを削除
    await storageClient.send(new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: fileKey,
    }))
    
    console.log(`Image deleted: ${fileKey}`)
    return { success: true }
    
  } catch (error) {
    console.error('Image delete failed:', error)
    return { 
      success: false, 
      error: `削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * 複数の画像ファイルを一括削除
 */
export async function deleteImagesAction(
  fileKeys: string[]
): Promise<{ success: boolean; deletedKeys?: string[]; errors?: string[] }> {
  const deletedKeys = []
  const errors = []
  
  for (const key of fileKeys) {
    const result = await deleteImageAction(key)
    if (result.success) {
      deletedKeys.push(key)
    } else {
      errors.push(result.error || 'Unknown error')
    }
  }
  
  return {
    success: deletedKeys.length > 0,
    deletedKeys: deletedKeys.length > 0 ? deletedKeys : undefined,
    errors: errors.length > 0 ? errors : undefined
  }
}

/**
 * フォルダ内の画像一覧を取得
 */
export async function listImagesAction(
  folder: string = 'images'
): Promise<{ success: boolean; files?: UploadedFile[]; error?: string }> {
  try {
    // 既存のlistFiles関数を再利用（import必要）
    const { listFiles } = await import('@/app/demo/article/actions')
    const result = await listFiles()
    
    if (!result.success) {
      return { success: false, error: result.message }
    }
    
    // 指定フォルダのファイルのみフィルター
    const folderFiles = result.files.filter(file => 
      file.key.startsWith(`${folder}/`) && 
      file.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
    )
    
    // UploadedFile形式に変換
    const uploadedFiles: UploadedFile[] = folderFiles.map(file => ({
      id: file.key.replace(`${folder}/`, '').replace(/\.[^/.]+$/, ''),
      name: file.name,
      originalName: file.name,
      url: `/api/files/${file.key}`,
      key: file.key,
      size: file.size,
      type: getContentType(file.name),
      uploadedAt: file.lastModified
    }))
    
    return {
      success: true,
      files: uploadedFiles
    }
    
  } catch (error) {
    console.error('List images failed:', error)
    return { 
      success: false, 
      error: `画像一覧の取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

/**
 * ファイル名からContent-Typeを推定
 */
function getContentType(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop()
  const typeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml'
  }
  return typeMap[extension || ''] || 'application/octet-stream'
}