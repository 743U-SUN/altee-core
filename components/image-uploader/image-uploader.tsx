'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ImageUploaderProps, UploadedFile } from '@/types/image-upload'
import { validateImageFiles } from '@/lib/image-uploader/image-validator'
import { processImage, processArticleImage } from '@/lib/image-uploader/image-processor'
import { uploadImageAction, deleteImageAction } from '@/app/actions/media/image-upload-actions'
import { DropZone } from './drop-zone'
import { ImagePreview } from './image-preview'

// 安定した空配列参照（無限ループ防止）
const EMPTY_FILES: UploadedFile[] = []

export function ImageUploader({
  mode,
  previewSize,
  deleteButtonPosition = 'auto',
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  rounded = false,
  className,
  disabled = false,
  folder = 'images',
  value = EMPTY_FILES,
  onUpload,
  onDelete,
  onError,
  showPreview = true
}: ImageUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(value)
  const [errors, setErrors] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const uploadedFilesRef = useRef<UploadedFile[]>(value)

  // valueが変更された時に内部状態を更新（参照比較で無限ループ防止）
  useEffect(() => {
    if (uploadedFilesRef.current !== value) {
      setUploadedFiles(value)
      uploadedFilesRef.current = value
    }
  }, [value])

  // エラーを追加
  const addError = useCallback((error: string) => {
    setErrors(prev => [...prev, error])
    onError?.(error)
    toast.error(error)

    // 5秒後にエラーを自動削除
    setTimeout(() => {
      setErrors(prev => prev.filter(e => e !== error))
    }, 5000)
  }, [onError])

  // 内部状態とrefを同期更新するヘルパー
  const updateFiles = useCallback((newFiles: UploadedFile[]) => {
    setUploadedFiles(newFiles)
    uploadedFilesRef.current = newFiles
  }, [])

  // ファイル選択時の処理
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (disabled || isUploading) return

    // ファイル数制限チェック
    const currentFiles = uploadedFilesRef.current
    const availableSlots = maxFiles - currentFiles.length
    if (availableSlots <= 0) {
      addError(`最大${maxFiles}ファイルまでです`)
      return
    }

    const limitedFiles = files.slice(0, availableSlots)

    // バリデーション
    const validationResults = validateImageFiles(limitedFiles, maxFiles, maxSize)
    const validFiles = limitedFiles.filter((_, index) => validationResults[index].isValid)
    const invalidFiles = limitedFiles.filter((_, index) => !validationResults[index].isValid)

    // エラーファイルの報告
    invalidFiles.forEach((_, index) => {
      const actualIndex = limitedFiles.findIndex((_, i) => !validationResults[i].isValid && limitedFiles[i] === invalidFiles[index])
      if (actualIndex !== -1) {
        addError(validationResults[actualIndex].error || 'Unknown validation error')
      }
    })

    // 有効なファイルを処理
    if (validFiles.length === 0) return

    if (mode === 'immediate') {
      setIsUploading(true)
      try {
        if (folder === 'article-images' || folder === 'article-thumbnails') {
          // 記事画像の場合は順次処理（メモリ節約）
          for (const file of validFiles) {
            try {
              const processResult = await processArticleImage(file)
              if (!processResult.success) {
                throw new Error(processResult.error)
              }

              const formData = new FormData()
              formData.append('file', processResult.processedFile!)

              const uploadResult = await uploadImageAction(formData, folder)
              if (!uploadResult.success) {
                throw new Error(uploadResult.error)
              }

              const newFile = uploadResult.file!
              const newFiles = [...uploadedFilesRef.current, newFile]
              updateFiles(newFiles)
              onUpload?.(newFiles)
              toast.success(`${file.name} をアップロードしました`)

            } catch (error) {
              addError(`アップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }
        } else {
          // その他は並列処理（Promise.allSettled で個別エラーハンドリング）
          const results = await Promise.allSettled(
            validFiles.map(async (file) => {
              const processResult = await processImage(file, {
                maxWidth: 1920,
                maxHeight: 1080,
                quality: 0.8,
                format: 'webp'
              })
              if (!processResult.success) {
                throw new Error(processResult.error)
              }

              const formData = new FormData()
              formData.append('file', processResult.processedFile!)

              const uploadResult = await uploadImageAction(formData, folder)
              if (!uploadResult.success) {
                throw new Error(uploadResult.error)
              }

              toast.success(`${file.name} をアップロードしました`)
              return uploadResult.file!
            })
          )

          // 成功/失敗を集計してバッチ更新
          const newUploadedFiles: UploadedFile[] = []
          for (const result of results) {
            if (result.status === 'fulfilled') {
              newUploadedFiles.push(result.value)
            } else {
              addError(`アップロードエラー: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`)
            }
          }

          if (newUploadedFiles.length > 0) {
            const newFiles = [...uploadedFilesRef.current, ...newUploadedFiles]
            updateFiles(newFiles)
            onUpload?.(newFiles)
          }
        }
      } finally {
        setIsUploading(false)
      }
    } else {
      // プレビューのみ（batch mode）
      const previewFiles: UploadedFile[] = validFiles.map((file, index) => ({
        id: `preview_${Date.now()}_${index}`,
        name: file.name,
        originalName: file.name,
        url: URL.createObjectURL(file),
        key: '',
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        file: file
      }))

      const newFiles = [...uploadedFilesRef.current, ...previewFiles]
      updateFiles(newFiles)
      onUpload?.(newFiles)
    }
  }, [disabled, isUploading, maxFiles, maxSize, mode, addError, onUpload, folder, updateFiles])

  // ファイル削除
  const handleDelete = useCallback(async (fileId: string) => {
    const currentFiles = uploadedFilesRef.current
    const fileToDelete = currentFiles.find(f => f.id === fileId)
    if (!fileToDelete) return

    try {
      // プレビューファイル（batch mode）の場合
      if (fileToDelete.key === '') {
        URL.revokeObjectURL(fileToDelete.url)
        const newFiles = currentFiles.filter(f => f.id !== fileId)
        updateFiles(newFiles)
        onDelete?.(fileId)
        return
      }

      // アップロード済みファイルの場合
      const deleteResult = await deleteImageAction(fileToDelete.key)
      if (!deleteResult.success) {
        throw new Error(deleteResult.error)
      }

      const newFiles = currentFiles.filter(f => f.id !== fileId)
      updateFiles(newFiles)
      onUpload?.(newFiles)
      onDelete?.(fileId)

    } catch (error) {
      addError(`削除エラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }, [addError, onDelete, onUpload, updateFiles])

  const isSingleFile = maxFiles === 1
  const hasFiles = uploadedFiles.length > 0
  const isDisabled = disabled || isUploading

  return (
    <div className={cn('space-y-4', className)}>
      {/* エラー表示 */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          ))}
        </div>
      )}

      {/* プレビュー表示制御 */}
      {showPreview ? (
        isSingleFile ? (
          hasFiles ? (
            <ImagePreview
              file={uploadedFiles[0]}
              previewSize={previewSize}
              deleteButtonPosition={deleteButtonPosition}
              rounded={rounded}
              onDelete={handleDelete}
            />
          ) : (
            <DropZone
              onFilesSelected={handleFilesSelected}
              maxFiles={1}
              disabled={isDisabled}
              accept={['image/*']}
              previewSize={previewSize}
              rounded={rounded}
            />
          )
        ) : (
          <>
            {hasFiles && (
              <div className={cn(
                'grid gap-4',
                typeof previewSize === 'object' || previewSize === 'large'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : previewSize === 'medium'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                  : 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8'
              )}>
                {uploadedFiles.map((file) => (
                  <ImagePreview
                    key={file.id}
                    file={file}
                    previewSize={previewSize}
                    deleteButtonPosition={deleteButtonPosition}
                    rounded={rounded}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}

            {uploadedFiles.length < maxFiles && (
              <DropZone
                onFilesSelected={handleFilesSelected}
                maxFiles={maxFiles - uploadedFiles.length}
                disabled={isDisabled}
                accept={['image/*']}
                previewSize={previewSize}
                rounded={rounded}
              />
            )}
          </>
        )
      ) : (
        <DropZone
          onFilesSelected={handleFilesSelected}
          maxFiles={maxFiles}
          disabled={isDisabled}
          accept={['image/*']}
          previewSize={previewSize}
          rounded={rounded}
        />
      )}
    </div>
  )
}
