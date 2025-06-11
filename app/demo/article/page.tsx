'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { initStorageAction, uploadFile, listFiles } from './actions'
import { uploadImagesAction } from '@/app/actions/image-upload-actions'
import { processImage } from '@/lib/image-uploader/image-processor'
import { ImageUploader } from '@/components/image-uploader/image-uploader'
import type { UploadedFile } from '@/types/image-upload'

type FileInfo = {
  key: string
  name: string
  size: number
  lastModified: string
}

export default function ArticleDemoPage() {
  const [initStatus, setInitStatus] = useState<string>('')
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [listStatus, setListStatus] = useState<string>('')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isListLoading, setIsListLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // 画像アップローダー用の状態
  const [immediateUploadFiles, setImmediateUploadFiles] = useState<UploadedFile[]>([])
  const [batchUploadFiles, setBatchUploadFiles] = useState<UploadedFile[]>([])
  const [profileImage, setProfileImage] = useState<UploadedFile[]>([])

  const handleInitStorage = async () => {
    setIsLoading(true)
    try {
      const result = await initStorageAction()
      setInitStatus(result.success ? `✅ ${result.message}` : `❌ ${result.message}`)
    } catch (error) {
      setInitStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsUploading(true)
    
    try {
      const formData = new FormData(event.currentTarget)
      const result = await uploadFile(formData)
      
      if (result.success) {
        setUploadStatus(`✅ ${result.message}`)
        // フォームをリセット
        if (formRef.current) {
          formRef.current.reset()
        }
        // ファイル一覧を自動更新
        handleListFiles()
      } else {
        setUploadStatus(`❌ ${result.message}`)
      }
    } catch (error) {
      setUploadStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleListFiles = async () => {
    setIsListLoading(true)
    try {
      const result = await listFiles()
      
      if (result.success) {
        setFiles(result.files)
        setListStatus(`✅ ${result.message}`)
      } else {
        setListStatus(`❌ ${result.message}`)
      }
    } catch (error) {
      setListStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsListLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleBatchUpload = async () => {
    if (batchUploadFiles.length === 0) return

    setIsUploading(true)
    try {
      // プレビューファイル（Blob URL）から実際のFileオブジェクトを作成
      const originalFiles = await Promise.all(
        batchUploadFiles.map(async (uploadedFile) => {
          if (uploadedFile.key === '') { // プレビューファイルの場合
            const response = await fetch(uploadedFile.url)
            const blob = await response.blob()
            return new File([blob], uploadedFile.originalName, { type: uploadedFile.type })
          }
          return null
        })
      )

      const validFiles = originalFiles.filter((file): file is File => file !== null)
      
      if (validFiles.length === 0) {
        toast.error('アップロードするファイルがありません')
        return
      }

      // 各ファイルに対して画像処理を実行
      const processedFiles = await Promise.all(
        validFiles.map(async (file) => {
          const processResult = await processImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            format: 'webp'
          })

          if (!processResult.success) {
            throw new Error(`${file.name}: ${processResult.error}`)
          }

          return processResult.processedFile!
        })
      )

      const result = await uploadImagesAction(processedFiles, 'images')
      
      if (result.success && result.files) {
        toast.success(`${result.files.length}ファイルをアップロードしました（最適化済み）`)
        // バッチリストをクリア
        setBatchUploadFiles([])
        // ファイル一覧を更新
        handleListFiles()
      } else {
        const errorCount = result.errors?.length || 0
        toast.error(`${errorCount}ファイルのアップロードに失敗しました`)
        if (result.errors) {
          result.errors.forEach(error => toast.error(error))
        }
      }
    } catch (error) {
      toast.error(`バッチアップロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Article Demo - File Storage Test</h1>
      
      <div className="grid gap-6">
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Storage Initialization</h2>
          <p className="text-muted-foreground mb-4">
            MinIOにバケット（dev-storage）とディレクトリ構造を作成します。
          </p>
          
          <button
            onClick={handleInitStorage}
            disabled={isLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 mb-4"
          >
            {isLoading ? 'Initializing...' : 'Initialize Storage'}
          </button>
          
          {initStatus && (
            <div className="border rounded p-4 bg-gray-50">
              <p className="text-sm text-gray-800">{initStatus}</p>
            </div>
          )}
        </section>

        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">File Upload Test</h2>
          <p className="text-muted-foreground mb-4">
            MinIOへのファイルアップロードをテストします。
          </p>
          
          <form ref={formRef} onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label htmlFor="file" className="block text-sm font-medium mb-2">
                ファイルを選択
              </label>
              <input
                type="file"
                id="file"
                name="file"
                accept="image/*,.md,.txt"
                required
                className="block w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            
            <button
              type="submit"
              disabled={isUploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'アップロード'}
            </button>
          </form>
          
          {uploadStatus && (
            <div className="border rounded p-4 bg-gray-50 mt-4">
              <p className="text-sm text-gray-800">{uploadStatus}</p>
            </div>
          )}
        </section>

        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">File List Test</h2>
          <p className="text-muted-foreground mb-4">
            MinIOからのファイル一覧取得をテストします。
          </p>
          
          <button
            onClick={handleListFiles}
            disabled={isListLoading}
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 mb-4"
          >
            {isListLoading ? 'Loading...' : 'ファイル一覧を取得'}
          </button>
          
          {listStatus && (
            <div className="border rounded p-4 bg-gray-50 mb-4">
              <p className="text-sm text-gray-800">{listStatus}</p>
            </div>
          )}
          
          <div className="border rounded p-4 bg-gray-50">
            {files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <p className="font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                ファイルがありません。まずはファイルをアップロードしてください。
              </p>
            )}
          </div>
        </section>

        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">File Display Test</h2>
          <p className="text-muted-foreground mb-4">
            アップロードした画像の表示テストです。
          </p>
          
          <div className="border rounded p-4 bg-gray-50 min-h-32">
            {files.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {files
                  .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                  .map((file, index) => (
                    <div key={index} className="bg-white rounded border p-4">
                      <div className="relative w-full h-48 mb-2">
                        <Image
                          src={`/api/files/${file.key}`}
                          alt={file.name}
                          fill
                          className="object-contain rounded"
                          unoptimized={true}
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                      <p className="text-xs text-gray-600">{formatFileSize(file.size)}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-32">
                <p className="text-sm text-gray-600">
                  画像ファイルをアップロードしてください...
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 画像アップローダーテストセクション */}
        <section className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Image Uploader Test</h2>
          <p className="text-muted-foreground mb-6">
            新しい画像アップローダーコンポーネントのテストです。
          </p>

          <div className="space-y-8">
            {/* 即座アップロードモード */}
            <div>
              <h3 className="font-medium mb-3">即座アップロードモード（Large）</h3>
              <p className="text-sm text-gray-600 mb-4">
                ファイル選択/ドロップ時に自動でアップロードされます
              </p>
              <ImageUploader
                mode="immediate"
                previewSize="large"
                maxFiles={1}
                value={immediateUploadFiles}
                onUpload={setImmediateUploadFiles}
                onDelete={(fileId) => {
                  setImmediateUploadFiles(prev => prev.filter(f => f.id !== fileId))
                }}
                onError={(error) => console.error('Upload error:', error)}
              />
            </div>

            {/* バッチアップロードモード */}
            <div>
              <h3 className="font-medium mb-3">バッチアップロードモード（Medium）</h3>
              <p className="text-sm text-gray-600 mb-4">
                プレビューのみ表示、フォーム送信時にまとめてアップロード
              </p>
              <ImageUploader
                mode="batch"
                previewSize="medium"
                maxFiles={5}
                value={batchUploadFiles}
                onUpload={setBatchUploadFiles}
                onDelete={(fileId) => {
                  setBatchUploadFiles(prev => prev.filter(f => f.id !== fileId))
                }}
                onError={(error) => console.error('Batch error:', error)}
              />
              {batchUploadFiles.length > 0 && (
                <button
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                  onClick={handleBatchUpload}
                >
                  {isUploading ? 'アップロード中...' : `一括アップロード (${batchUploadFiles.length}ファイル)`}
                </button>
              )}
            </div>

            {/* プロフィール画像モード */}
            <div>
              <h3 className="font-medium mb-3">プロフィール画像モード（Small・円形）</h3>
              <p className="text-sm text-gray-600 mb-4">
                小さなプロフィール画像用（1ファイルのみ）
              </p>
              <ImageUploader
                mode="immediate"
                previewSize="small"
                deleteButtonPosition="external"
                maxFiles={1}
                rounded={true}
                value={profileImage}
                onUpload={setProfileImage}
                onDelete={(fileId) => {
                  setProfileImage(prev => prev.filter(f => f.id !== fileId))
                }}
                onError={(error) => console.error('Profile error:', error)}
              />
            </div>

            {/* カスタムサイズモード */}
            <div>
              <h3 className="font-medium mb-3">カスタムサイズモード</h3>
              <p className="text-sm text-gray-600 mb-4">
                カスタムサイズ（200x150px）でのプレビュー
              </p>
              <ImageUploader
                mode="immediate"
                previewSize={{ width: 200, height: 150 }}
                maxFiles={2}
                value={[]}
                onUpload={(files) => console.log('Custom size upload:', files)}
                onDelete={(fileId) => console.log('Custom size delete:', fileId)}
                onError={(error) => console.error('Custom size error:', error)}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}