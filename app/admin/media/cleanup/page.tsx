'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trash2, RefreshCw, FileX, HardDrive, Database, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { detectOrphanFiles, cleanupOrphanFiles, getDeletionStats } from '@/app/actions/cleanup-actions'
import { cleanupExpiredFiles, getDeletedMediaFiles, restoreMediaFile } from '@/app/actions/media-actions'

interface OrphanFile {
  container: string
  key: string
  size: number
  lastModified: string
  storageKey: string
}

interface Stats {
  storageFiles: number
  dbFiles: number
  orphanFiles: number
  orphanSizeMB: number
  containers: {
    'article-thumbnails': number
    'article-images': number
    'images': number
  }
}

export default function CleanupPage() {
  const [orphanFiles, setOrphanFiles] = useState<OrphanFile[]>([])
  const [deletedFiles, setDeletedFiles] = useState<any[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [expiredCleanupLoading, setExpiredCleanupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)

  const handleDetectOrphans = async () => {
    setLoading(true)
    try {
      const result = await detectOrphanFiles()
      if (result.success) {
        setOrphanFiles(result.orphans)
        toast.success(`孤立ファイル検出完了: ${result.count}件`)
      } else {
        toast.error(`検出エラー: ${result.error}`)
      }
    } catch (error) {
      toast.error(`検出に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGetStats = async () => {
    setLoading(true)
    try {
      const result = await getDeletionStats()
      if (result.success && result.stats) {
        setStats(result.stats)
        toast.success('統計情報を取得しました')
      } else {
        toast.error(`統計取得エラー: ${result.error}`)
      }
    } catch (error) {
      toast.error(`統計取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupOrphans = async () => {
    if (orphanFiles.length === 0) {
      toast.error('削除対象の孤立ファイルがありません')
      return
    }

    const confirmed = confirm(`${orphanFiles.length}個の孤立ファイルを削除しますか？\n\nこの操作は取り消せません。`)
    if (!confirmed) return

    setCleanupLoading(true)
    try {
      const orphanKeys = orphanFiles.map(f => f.storageKey)
      const result = await cleanupOrphanFiles(orphanKeys)
      
      if (result.success) {
        toast.success(`${result.deletedCount}個のファイルを削除しました`)
        if (result.errors && result.errors.length > 0) {
          toast.error(`一部エラー: ${result.errors.length}件`)
        }
        // 削除後に再検出
        await handleDetectOrphans()
      } else {
        toast.error(`削除エラー: ${result.error}`)
      }
    } catch (error) {
      toast.error(`削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCleanupLoading(false)
    }
  }

  const handleCleanupExpiredFiles = async () => {
    const confirmed = confirm('期限切れ論理削除ファイルを物理削除しますか？\n\nこの操作は取り消せません。')
    if (!confirmed) return

    setExpiredCleanupLoading(true)
    try {
      const result = await cleanupExpiredFiles()
      
      if (result.success) {
        toast.success(result.message)
        if (result.errors && result.errors.length > 0) {
          toast.error(`一部エラー: ${result.errors.length}件`)
        }
        // 統計情報を更新
        await handleGetStats()
        await handleLoadDeletedFiles()
      }
    } catch (error) {
      toast.error(`削除に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExpiredCleanupLoading(false)
    }
  }

  const handleLoadDeletedFiles = async () => {
    setLoading(true)
    try {
      const result = await getDeletedMediaFiles()
      setDeletedFiles(result.mediaFiles)
      toast.success(`削除済みファイル: ${result.mediaFiles.length}件`)
    } catch (error) {
      toast.error(`取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreFile = async (fileId: string) => {
    const confirmed = confirm('このファイルを復旧しますか？')
    if (!confirmed) return

    setRestoreLoading(true)
    try {
      const result = await restoreMediaFile(fileId)
      
      if (result.success) {
        toast.success('ファイルを復旧しました')
        await handleLoadDeletedFiles()
        await handleGetStats()
      }
    } catch (error) {
      toast.error(`復旧に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRestoreLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ファイルクリーンアップ</h1>
          <p className="text-muted-foreground">
            孤立ファイルの検出・削除とストレージ統計情報
          </p>
        </div>
      </div>

      {/* 統計情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            ストレージ統計
          </CardTitle>
          <CardDescription>
            現在のファイル使用状況とコンテナ別統計
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={handleGetStats} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              統計情報更新
            </Button>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <HardDrive className="h-4 w-4" />
                  ストレージファイル
                </div>
                <div className="text-2xl font-bold">{stats.storageFiles}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Database className="h-4 w-4" />
                  DBレコード
                </div>
                <div className="text-2xl font-bold">{stats.dbFiles}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <FileX className="h-4 w-4" />
                  孤立ファイル
                </div>
                <div className="text-2xl font-bold text-red-600">{stats.orphanFiles}</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">無駄な容量</div>
                <div className="text-2xl font-bold text-red-600">{stats.orphanSizeMB} MB</div>
              </div>
            </div>
          )}

          {stats && (
            <div>
              <h3 className="font-semibold mb-2">コンテナ別ファイル数</h3>
              <div className="flex gap-2">
                <Badge variant="outline">
                  article-thumbnails: {stats.containers['article-thumbnails']}
                </Badge>
                <Badge variant="outline">
                  article-images: {stats.containers['article-images']}
                </Badge>
                <Badge variant="outline">
                  images: {stats.containers.images}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 孤立ファイル検出・削除 */}
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
              onClick={handleDetectOrphans} 
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '検出中...' : '孤立ファイル検出'}
            </Button>
            
            {orphanFiles.length > 0 && (
              <Button 
                onClick={handleCleanupOrphans} 
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

      {/* 30日経過ファイル物理削除 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            論理削除ファイル物理削除
          </CardTitle>
          <CardDescription>
            30日経過した論理削除ファイルを完全に削除
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">論理削除システムについて</span>
            </div>
            <p className="text-blue-700 text-sm mb-3">
              ファイル削除時は即座に物理削除されず、30日間の猶予期間があります。
              この機能では期限切れファイルを完全削除します。
            </p>
            <div className="text-xs text-blue-600 space-y-1">
              <div>• 削除されたファイルは30日間復旧可能</div>
              <div>• 30日経過後、このボタンで物理削除実行</div>
              <div>• 物理削除後は復旧不可能</div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleLoadDeletedFiles} 
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              削除済みファイル一覧表示
            </Button>
            <Button 
              onClick={handleCleanupExpiredFiles} 
              disabled={expiredCleanupLoading}
              variant="destructive"
            >
              <Trash2 className={`mr-2 h-4 w-4 ${expiredCleanupLoading ? 'animate-spin' : ''}`} />
              {expiredCleanupLoading ? '削除中...' : '期限切れファイルを物理削除'}
            </Button>
          </div>

          {deletedFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">削除済みファイル一覧 ({deletedFiles.length}件)</h3>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <div className="divide-y">
                  {deletedFiles.map((file: any) => (
                    <div key={file.id} className="p-3 flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="font-mono">{file.originalName}</div>
                        <div className="text-muted-foreground text-xs">
                          削除日時: {new Date(file.deletedAt).toLocaleString('ja-JP')}
                          {file.scheduledDeletionAt && (
                            <span className="ml-4">
                              物理削除予定: {new Date(file.scheduledDeletionAt).toLocaleString('ja-JP')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreFile(file.id)}
                          disabled={restoreLoading}
                        >
                          復旧
                        </Button>
                        <Badge variant="outline">{file.containerName}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            <strong>注意:</strong> この操作は取り消すことができません。
            期限切れファイルのみが対象となります。
          </div>
        </CardContent>
      </Card>
    </div>
  )
}