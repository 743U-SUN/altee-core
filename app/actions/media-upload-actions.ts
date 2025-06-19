'use server'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { storageClient } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { MediaType } from '@prisma/client'
import { sanitizeSVGFile } from '@/lib/image-uploader/svg-sanitizer'

interface MediaUploadData {
  uploadType: MediaType
  description?: string
  altText?: string
  tags?: string[]
}

/**
 * メディアファイルをアップロード（メタデータ付き）
 */
interface UploadedFileData {
  id: string
  name: string
  originalName: string
  url: string
  key: string
  size: number
  type: string
  uploadedAt: string
  description?: string
  altText?: string
  tags?: string[]
}

export async function uploadMediaFileAction(
  formData: FormData,
  metadata: MediaUploadData
): Promise<{ success: boolean; file?: UploadedFileData; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return { success: false, error: '管理者権限が必要です' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'ファイルが選択されていません' }
    }

    // ファイル情報
    const fileName = file.name
    const fileType = file.type
    const fileSize = file.size
    
    // ファイル形式チェック
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/svg+xml'
    ]
    if (!supportedTypes.includes(fileType)) {
      return { success: false, error: 'サポートされていないファイル形式です' }
    }

    // ファイルサイズチェック（10MB制限）
    const maxSize = 10 * 1024 * 1024
    if (fileSize > maxSize) {
      return { success: false, error: 'ファイルサイズが10MBを超えています' }
    }
    
    // ユニークなファイル名を生成
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = fileName.split('.').pop() || ''
    const uniqueFileName = `${timestamp}_${randomString}.${extension}`
    
    // uploadTypeに基づいてコンテナを決定
    let containerName: string
    switch (metadata.uploadType) {
      case 'THUMBNAIL':
        containerName = 'article-thumbnails'
        break
      case 'CONTENT':
        containerName = 'article-images'
        break
      case 'SYSTEM':
        containerName = 'system'
        break
      default:
        return { success: false, error: '無効なアップロードタイプです' }
    }

    // Swift最適化された階層構造: YYYY/MM/filename
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    let key = `${year}/${month}/${uniqueFileName}`
    
    let processedFile = file
    
    // SVGファイルの場合はサニタイズ
    if (fileType === 'image/svg+xml') {
      const sanitizeResult = await sanitizeSVGFile(file)
      if (!sanitizeResult.success) {
        return { success: false, error: sanitizeResult.error }
      }
      processedFile = sanitizeResult.sanitizedFile!
    }

    // S3へのアップロード
    const fileBuffer = Buffer.from(await processedFile.arrayBuffer())
    
    const command = new PutObjectCommand({
      Bucket: containerName,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      ContentLength: fileBuffer.length,
    })

    await storageClient.send(command)

    // データベースに保存
    const storageKey = `${containerName}/${key}`
    const mediaFile = await prisma.mediaFile.create({
      data: {
        storageKey,
        containerName,
        originalName: fileName,
        fileName: uniqueFileName,
        fileSize: fileBuffer.length,
        mimeType: fileType,
        uploadType: metadata.uploadType,
        uploaderId: session.user.id,
        description: metadata.description || null,
        altText: metadata.altText || null,
        tags: metadata.tags && metadata.tags.length > 0 ? metadata.tags : undefined,
      },
    })

    // レスポンス用のデータを構築
    const uploadedFile = {
      id: mediaFile.id,
      name: uniqueFileName,
      originalName: fileName,
      url: `${process.env.NEXT_PUBLIC_STORAGE_URL}/${storageKey}`,
      key: storageKey,
      size: fileSize,
      type: fileType,
      uploadedAt: mediaFile.createdAt.toISOString(),
      description: metadata.description,
      altText: metadata.altText,
      tags: metadata.tags,
    }

    return { success: true, file: uploadedFile }
  } catch (error) {
    console.error('Media upload error:', error)
    return { success: false, error: 'アップロードに失敗しました' }
  }
}