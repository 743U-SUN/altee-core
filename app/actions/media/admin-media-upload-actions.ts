'use server'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import type { MediaType } from '@prisma/client'
import { sanitizeSVGFile } from '@/lib/image-uploader/svg-sanitizer'
import { TYPE_TO_FOLDER } from '@/lib/image-uploader/upload-type-map'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'

interface MediaUploadData {
  uploadType: MediaType
  description?: string
  altText?: string
  tags?: string[]
}

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
  const session = await requireAdmin()

  try {

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'ファイルが選択されていません' }
    }

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
    const randomString = crypto.randomUUID().slice(0, 8)
    const extension = fileName.split('.').pop() || ''
    const uniqueFileName = `${timestamp}_${randomString}.${extension}`

    // uploadTypeに基づいてフォルダを決定
    const folder = TYPE_TO_FOLDER[metadata.uploadType]
    if (!folder) {
      return { success: false, error: '無効なアップロードタイプです' }
    }

    // 日付ベースの階層構造: folder/YYYY/MM/filename
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const key = `${folder}/${year}/${month}/${uniqueFileName}`

    let processedFile = file

    // SVGファイルの場合はサニタイズ
    if (fileType === 'image/svg+xml') {
      const sanitizeResult = await sanitizeSVGFile(file)
      if (!sanitizeResult.success) {
        return { success: false, error: sanitizeResult.error }
      }
      processedFile = sanitizeResult.sanitizedFile!
    }

    const fileBuffer = Buffer.from(await processedFile.arrayBuffer())

    await storageClient.send(new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: fileType,
      ContentLength: fileBuffer.length,
    }))

    const storageKey = `${STORAGE_BUCKET}/${key}`
    const mediaFile = await prisma.mediaFile.create({
      data: {
        storageKey,
        containerName: folder,
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

    const uploadedFile: UploadedFileData = {
      id: mediaFile.id,
      name: uniqueFileName,
      originalName: fileName,
      url: getPublicUrl(storageKey),
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
