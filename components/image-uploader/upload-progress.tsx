'use client'

import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UploadProgress } from '@/types/image-upload'

interface UploadProgressProps {
  progress: UploadProgress
  className?: string
}

export function UploadProgressComponent({ progress, className }: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (progress.status) {
      case 'uploading':
        return `アップロード中... ${progress.progress}%`
      case 'completed':
        return 'アップロード完了'
      case 'error':
        return `エラー: ${progress.error || 'Unknown error'}`
      default:
        return ''
    }
  }

  const getProgressBarColor = () => {
    switch (progress.status) {
      case 'uploading':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {progress.status === 'uploading' && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={cn('h-1.5 rounded-full transition-all duration-300', getProgressBarColor())}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

interface MultipleUploadProgressProps {
  progressList: UploadProgress[]
  className?: string
}

export function MultipleUploadProgress({ progressList, className }: MultipleUploadProgressProps) {
  if (progressList.length === 0) return null

  const completedCount = progressList.filter(p => p.status === 'completed').length
  const errorCount = progressList.filter(p => p.status === 'error').length
  const uploadingCount = progressList.filter(p => p.status === 'uploading').length
  
  const totalProgress = progressList.reduce((sum, p) => sum + p.progress, 0) / progressList.length

  return (
    <div className={cn('space-y-3 p-4 bg-gray-50 rounded-lg', className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">アップロード進捗</h4>
        <span className="text-sm text-gray-600">
          {completedCount}/{progressList.length} 完了
        </span>
      </div>
      
      {/* 全体の進捗バー */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${totalProgress}%` }}
        />
      </div>
      
      {/* 統計情報 */}
      <div className="flex gap-4 text-sm">
        {uploadingCount > 0 && (
          <span className="text-blue-600">
            アップロード中: {uploadingCount}
          </span>
        )}
        {completedCount > 0 && (
          <span className="text-green-600">
            完了: {completedCount}
          </span>
        )}
        {errorCount > 0 && (
          <span className="text-red-600">
            エラー: {errorCount}
          </span>
        )}
      </div>
      
      {/* 個別の進捗（最大5件まで表示） */}
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {progressList.slice(0, 5).map((progress) => (
          <UploadProgressComponent
            key={progress.fileId}
            progress={progress}
            className="text-xs"
          />
        ))}
        {progressList.length > 5 && (
          <p className="text-xs text-gray-500 text-center">
            ...他 {progressList.length - 5} 件
          </p>
        )}
      </div>
    </div>
  )
}