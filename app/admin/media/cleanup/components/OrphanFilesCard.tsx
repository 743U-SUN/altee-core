'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trash2, RefreshCw, FileX } from 'lucide-react'

interface OrphanFile {
  container: string
  key: string
  size: number
  lastModified: string
  storageKey: string
}

interface OrphanFilesCardProps {
  orphanFiles: OrphanFile[]
  loading: boolean
  cleanupLoading: boolean
  onDetect: () => void
  onCleanup: () => void
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function OrphanFilesCard({
  orphanFiles,
  loading,
  cleanupLoading,
  onDetect,
  onCleanup,
}: OrphanFilesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileX className="h-5 w-5" />
          孤立ファイル管理
        </CardTitle>
        <CardDescription>
          データベースに記録のないストレージファイルを検出・削除
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <Button
            onClick={onDetect}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '検出中...' : '孤立ファイル検出'}
          </Button>

          {orphanFiles.length > 0 && (
            <Button
              onClick={onCleanup}
              disabled={cleanupLoading}
              variant="destructive"
            >
              <Trash2 className={`mr-2 h-4 w-4 ${cleanupLoading ? 'animate-spin' : ''}`} />
              {cleanupLoading ? '削除中...' : `${orphanFiles.length}個のファイルを削除`}
            </Button>
          )}
        </div>

        {orphanFiles.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800">
                {orphanFiles.length}個の孤立ファイルが見つかりました
              </span>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <div className="divide-y">
                {orphanFiles.map((file, index) => (
                  <div key={index} className="p-3 flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <div className="font-mono">{file.storageKey}</div>
                      <div className="text-muted-foreground">
                        {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString('ja-JP')}
                      </div>
                    </div>
                    <Badge variant="outline">{file.container}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {orphanFiles.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            孤立ファイルは検出されていません。<br />
            「孤立ファイル検出」ボタンを押して検索してください。
          </div>
        )}
      </CardContent>
    </Card>
  )
}
