'use server'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
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
    
    // コンテナとキーを決定（専用コンテナ対応）
    let bucket: string
    let key: string
    
    if (folder === 'article-thumbnails' || folder === 'article-images' || folder === 'system-assets') {
      // 専用コンテナに直接保存
      bucket = folder
      
      // Swift最適化された階層構造: YYYY/MM/filename
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      key = `${year}/${month}/${uniqueFileName}`
    } else {
      // 従来の方式（imagesコンテナ内フォルダ）
      bucket = STORAGE_BUCKET
      key = `${folder}/${uniqueFileName}`
    }
    
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
    
    // ストレージにアップロード
    await storageClient.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: processedFile.type,
      ContentLength: processedFile.size,
    }))
    
    // ユーザー認証チェック
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // MediaFileテーブルにレコード作成
    const mediaFile = await prisma.mediaFile.create({
      data: {
        storageKey: `${bucket}/${key}`, // 完全なストレージキー
        containerName: bucket, // 実際のコンテナ名
        originalName: fileName,
        fileName: uniqueFileName,
        fileSize: processedFile.size,
        mimeType: processedFile.type,
        uploadType: folder === 'article-thumbnails' ? 'THUMBNAIL' : 'CONTENT',
        uploaderId: session.user.id,
      }
    })

    // アップロード済みファイル情報を作成
    const uploadedFile: UploadedFile = {
      id: mediaFile.id, // データベースのIDを使用
      name: uniqueFileName,
      originalName: fileName,
      url: `/api/files/${bucket}/${key}`,
      key: `${bucket}/${key}`, // 完全なストレージキー
      size: processedFile.size,
      type: processedFile.type,
      uploadedAt: mediaFile.createdAt.toISOString()
    }
    
    console.log(`Image uploaded to ${bucket}: ${key}`)
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
 * 複数の画像ファイルを一括アップロード（並列処理）
 */
export async function uploadImagesAction(
  files: File[],
  folder: string = 'images'
): Promise<{ success: boolean; files?: UploadedFile[]; errors?: string[] }> {
  // 並列処理でアップロード
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadImageAction(formData, folder)
  })
  
  const results = await Promise.all(uploadPromises)
  
  // 成功したファイルとエラーを分離
  const successfulFiles: UploadedFile[] = []
  const errors: string[] = []
  
  results.forEach((result) => {
    if (result.success && result.file) {
      successfulFiles.push(result.file)
    } else {
      errors.push(result.error || 'Unknown error')
    }
  })
  
  return {
    success: successfulFiles.length > 0,
    files: successfulFiles,
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
    // ユーザー認証チェック
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: '認証が必要です' }
    }

    // MediaFileレコードを取得
    const mediaFile = await prisma.mediaFile.findUnique({
      where: { storageKey: fileKey }
    })

    if (!mediaFile) {
      return { success: false, error: 'ファイルが見つかりません' }
    }

    // 権限チェック（管理者または自分がアップロードしたファイル）
    if (session.user.role !== 'ADMIN' && mediaFile.uploaderId !== session.user.id) {
      return { success: false, error: '削除権限がありません' }
    }

    // オブジェクトストレージからファイルを削除
    // storageKeyの形式: "container/path/file.ext" または "file.ext"
    const storageKeyParts = fileKey.split('/')
    let bucket = STORAGE_BUCKET
    let objectKey = fileKey
    
    // 専用コンテナの場合（例: "article-thumbnails/2024/12/file.webp"）
    if (storageKeyParts.length > 1) {
      bucket = storageKeyParts[0] // "article-thumbnails"
      objectKey = storageKeyParts.slice(1).join('/') // "2024/12/file.webp"
    }
    
    await storageClient.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }))

    // MediaFileレコードを削除
    await prisma.mediaFile.delete({
      where: { id: mediaFile.id }
    })
    
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
 * 複数の画像ファイルを一括削除（並列処理）
 */
export async function deleteImagesAction(
  fileKeys: string[]
): Promise<{ success: boolean; deletedKeys?: string[]; errors?: string[] }> {
  // 並列処理で削除
  const deletePromises = fileKeys.map(key => deleteImageAction(key))
  const results = await Promise.all(deletePromises)
  
  // 成功したキーとエラーを分離
  const deletedKeys: string[] = []
  const errors: string[] = []
  
  results.forEach((result, index) => {
    if (result.success) {
      deletedKeys.push(fileKeys[index])
    } else {
      errors.push(result.error || 'Unknown error')
    }
  })
  
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