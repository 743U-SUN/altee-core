'use server'

import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { storageClient, STORAGE_BUCKET } from '@/lib/storage'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import type { UploadedFile } from '@/types/image-upload'
import { sanitizeSVGFile } from '@/lib/image-uploader/svg-sanitizer'
import { FOLDER_TO_TYPE, DATE_HIERARCHY_FOLDERS } from '@/lib/image-uploader/upload-type-map'
import { getPublicUrl } from '@/lib/image-uploader/get-public-url'

/** サーバーサイドMIMEホワイトリスト */
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
])

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/** MIMEタイプから安全な拡張子を導出 */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

/** フォルダ名ホワイトリスト検証 */
function isValidFolder(folder: string): boolean {
  return folder in FOLDER_TO_TYPE && !folder.includes('..')
}

/**
 * 画像ファイルをアップロード
 */
export async function uploadImageAction(
  formData: FormData,
  folder: string = 'images'
): Promise<{ success: boolean; file?: UploadedFile; error?: string }> {
  try {
    const session = await requireAuth()

    const rawFile = formData.get('file')
    if (!rawFile || !(rawFile instanceof File)) {
      return { success: false, error: 'ファイルが選択されていません' }
    }
    const file = rawFile

    // フォルダパス・トラバーサル防止
    if (!isValidFolder(folder)) {
      return { success: false, error: '無効なアップロード先です' }
    }

    const fileName = file.name
    const fileType = file.type

    // サーバーサイドMIMEバリデーション
    if (!ALLOWED_MIME_TYPES.has(fileType)) {
      return { success: false, error: 'サポートされていないファイル形式です' }
    }

    // サーバーサイドサイズ制限
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'ファイルサイズが10MBを超えています' }
    }

    // MIMEタイプから安全な拡張子を導出（ユーザー提供のファイル名を使わない）
    const extension = MIME_TO_EXT[fileType] || 'bin'
    const timestamp = Date.now()
    const randomString = crypto.randomUUID().slice(0, 8)
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
      CacheControl: 'public, max-age=31536000, immutable',
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
  if (files.length > 10) {
    return { success: false, errors: ['一度にアップロードできるファイルは最大10個です'] }
  }

  // 並列度3に制限
  const CONCURRENCY = 3
  const results: Awaited<ReturnType<typeof uploadImageAction>>[] = []
  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY)
    const batchResults = await Promise.all(
      batch.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        return uploadImageAction(formData, folder)
      })
    )
    results.push(...batchResults)
  }

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
    // バケット名はサーバー側の固定値を使用（クライアント提供値を信頼しない）
    const objectKey = fileKey.startsWith(STORAGE_BUCKET + '/')
      ? fileKey.slice(STORAGE_BUCKET.length + 1)
      : fileKey

    await storageClient.send(new DeleteObjectCommand({
      Bucket: STORAGE_BUCKET,
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
    const session = await requireAuth()

    const mediaFiles = await prisma.mediaFile.findMany({
      where: {
        containerName: folder,
        deletedAt: null,
        // 非管理者は自分がアップロードしたファイルのみ
        ...(session.user.role !== 'ADMIN' && { uploaderId: session.user.id }),
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
