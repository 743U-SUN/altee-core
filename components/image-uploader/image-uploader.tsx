'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { ImageUploaderProps, UploadedFile } from '@/types/image-upload'
import { validateImageFiles } from '@/lib/image-uploader/image-validator'
import { processImage } from '@/lib/image-uploader/image-processor'
import { uploadImageAction, deleteImageAction } from '@/app/actions/image-upload-actions'
import { DropZone } from './drop-zone'
import { ImagePreview } from './image-preview'

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
  value = [],
  onUpload,
  onDelete,
  onError
}: ImageUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(value)
  const [errors, setErrors] = useState<string[]>([])

  // valueが変更された時に内部状態を更新
  useEffect(() => {
    setUploadedFiles(value)
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


  // ファイル処理とアップロード
  const processAndUploadFile = useCallback(async (file: File) => {
    try {
      // 画像処理
      const processResult = await processImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'webp'
      })

      if (!processResult.success) {
        throw new Error(processResult.error)
      }

      // アップロード
      const formData = new FormData()
      formData.append('file', processResult.processedFile!)
      
      const uploadResult = await uploadImageAction(formData, folder)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      // 成功
      const newFile = uploadResult.file!
      setUploadedFiles(prev => [...prev, newFile])
      onUpload?.([...uploadedFiles, newFile])
      
      // 成功トースト
      toast.success(`${file.name} をアップロードしました`)

    } catch (error) {
      const errorMessage = `アップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      addError(errorMessage)
    }
  }, [uploadedFiles, addError, onUpload, folder])

  // ファイル選択時の処理
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (disabled) return

    // ファイル数制限チェック
    const availableSlots = maxFiles - uploadedFiles.length
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
      // 即座にアップロード
      validFiles.forEach(processAndUploadFile)
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
        uploadedAt: new Date().toISOString()
      }))
      
      setUploadedFiles(prev => [...prev, ...previewFiles])
      onUpload?.([...uploadedFiles, ...previewFiles])
    }
  }, [disabled, maxFiles, maxSize, uploadedFiles, mode, addError, processAndUploadFile, onUpload])

  // ファイル削除
  const handleDelete = useCallback(async (fileId: string) => {
    const fileToDelete = uploadedFiles.find(f => f.id === fileId)
    if (!fileToDelete) return

    try {
      // プレビューファイル（batch mode）の場合
      if (fileToDelete.key === '') {
        URL.revokeObjectURL(fileToDelete.url)
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
        onDelete?.(fileId)
        return
      }

      // アップロード済みファイルの場合
      const deleteResult = await deleteImageAction(fileToDelete.key)
      if (!deleteResult.success) {
        throw new Error(deleteResult.error)
      }

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
      onDelete?.(fileId)

    } catch (error) {
      const errorMessage = `削除エラー: ${error instanceof Error ? error.message : 'Unknown error'}`
      addError(errorMessage)
    }
  }, [uploadedFiles, addError, onDelete])

  const isSingleFile = maxFiles === 1
  const hasFiles = uploadedFiles.length > 0

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

      {/* 単一ファイルの場合：プレビューまたはドロップゾーンのどちらか一方 */}
      {isSingleFile ? (
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
            disabled={disabled}
            accept={['image/*']}
            previewSize={previewSize}
            rounded={rounded}
          />
        )
      ) : (
        /* 複数ファイルの場合：従来通りプレビューとドロップゾーンを両方表示 */
        <>
          {/* ファイルプレビュー */}
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

          {/* ドロップゾーン（ファイル数制限に達していない場合のみ表示） */}
          {uploadedFiles.length < maxFiles && (
            <DropZone
              onFilesSelected={handleFilesSelected}
              maxFiles={maxFiles - uploadedFiles.length}
              disabled={disabled}
              accept={['image/*']}
              previewSize={previewSize}
              rounded={rounded}
            />
          )}
        </>
      )}
    </div>
  )
}