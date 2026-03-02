'use server'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import type { UploadedFile } from '@/types/image-upload'
import { sanitizeSVGFile } from '@/lib/image-uploader/svg-sanitizer'
import { FOLDER_TO_TYPE, DATE_HIERARCHY_FOLDERS } from '@/lib/image-uploader/upload-type-map'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'

/**
 * 画像ファイルをアップロード
 */
export async function uploadImageAction(
  formData: FormData,
  folder: string = 'images'
): Promise<{ success: boolean; file?: UploadedFile; error?: string }> {
  try {
    const session = await requireAuth()

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'ファイルが選択されていません' }
    }

    const fileName = file.name
    const fileType = file.type

    // ユニークなファイル名を生成
    const timestamp = Date.now()
    const randomString = crypto.randomUUID().slice(0, 8)
    const extension = fileName.split('.').pop() || ''
    const uniqueFileName = `${timestamp}_${randomString}.${extension}`

    const bucket = STORAGE_BUCKET
    let key: string

    if (DATE_HIERARCHY_FOLDERS.has(folder)) {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      key = `${folder}/${year}/${month}/${uniqueFileName}`
    } else {
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

    const buffer = Buffer.from(await processedFile.arrayBuffer())

    await storageClient.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: processedFile.type,
      ContentLength: processedFile.size,
    }))

    const storageKey = `${bucket}/${key}`
    const mediaFile = await prisma.mediaFile.create({
      data: {
        storageKey,
        containerName: folder,
        originalName: fileName,
        fileName: uniqueFileName,
        fileSize: processedFile.size,
        mimeType: processedFile.type,
        uploadType: FOLDER_TO_TYPE[folder] ?? 'CONTENT',
        uploaderId: session.user.id,
      }
    })

    const uploadedFile: UploadedFile = {
      id: mediaFile.id,
      name: uniqueFileName,
      originalName: fileName,
      url: getPublicUrl(storageKey),
      key: storageKey,
      size: processedFile.size,
      type: processedFile.type,
      uploadedAt: mediaFile.createdAt.toISOString()
    }

    return { success: true, file: uploadedFile }

  } catch (error) {
    console.error('Image upload failed:', error)
    return { success: false, error: 'アップロードに失敗しました' }
  }
}

/**
 * 複数の画像ファイルを一括アップロード（並列処理）
 */
export async function uploadImagesAction(
  files: File[],
  folder: string = 'images'
): Promise<{ success: boolean; files?: UploadedFile[]; errors?: string[] }> {
  const uploadPromises = files.map(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return uploadImageAction(formData, folder)
  })

  const results = await Promise.all(uploadPromises)

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
    const session = await requireAuth()

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

    // storageKeyの形式: "altee-images/folder/path/file.ext"
    const storageKeyParts = fileKey.split('/')
    const bucket = storageKeyParts[0]
    const objectKey = storageKeyParts.slice(1).join('/')

    await storageClient.send(new DeleteObjectCommand({
      Bucket: bucket,
      Key: objectKey,
    }))

    await prisma.mediaFile.delete({
      where: { id: mediaFile.id }
    })

    return { success: true }

  } catch (error) {
    console.error('Image delete failed:', error)
    return { success: false, error: '削除に失敗しました' }
  }
}

/**
 * 複数の画像ファイルを一括削除（並列処理）
 */
export async function deleteImagesAction(
  fileKeys: string[]
): Promise<{ success: boolean; deletedKeys?: string[]; errors?: string[] }> {
  const deletePromises = fileKeys.map(key => deleteImageAction(key))
  const results = await Promise.all(deletePromises)

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
    await requireAuth()

    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        containerName: folder,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    })

    const uploadedFiles: UploadedFile[] = mediaFiles.map(file => ({
      id: file.id,
      name: file.fileName,
      originalName: file.originalName,
      url: getPublicUrl(file.storageKey),
      key: file.storageKey,
      size: file.fileSize,
      type: file.mimeType,
      uploadedAt: file.createdAt.toISOString()
    }))

    return { success: true, files: uploadedFiles }

  } catch (error) {
    console.error('List images failed:', error)
    return { success: false, error: '画像一覧の取得に失敗しました' }
  }
}
