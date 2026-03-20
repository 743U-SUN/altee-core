'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Trash2, RefreshCw, Clock } from 'lucide-react'

interface DeletedFile {
  id: string
  originalName: string
  deletedAt: Date | null
  scheduledDeletionAt?: Date | null
  containerName: string
}

interface SoftDeletedFilesCardProps {
  deletedFiles: DeletedFile[]
  loading: boolean
  expiredCleanupLoading: boolean
  restoreLoading: boolean
  onLoadFiles: () => void
  onCleanupExpired: () => void
  onRestoreFile: (fileId: string) => void
}

export function SoftDeletedFilesCard({
  deletedFiles,
  loading,
  expiredCleanupLoading,
  restoreLoading,
  onLoadFiles,
  onCleanupExpired,
  onRestoreFile,
}: SoftDeletedFilesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          論理削除ファイル物理削除
        </CardTitle>
        <CardDescription>
          5分経過した論理削除ファイルを完全に削除（テスト用）
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span className="font-semibold text-blue-800">論理削除システムについて</span>
          </div>
          <p className="text-blue-700 text-sm mb-3">
            ファイル削除時は即座に物理削除されず、5分間の猶予期間があります（テスト用）。
            この機能では期限切れファイルを完全削除します。
          </p>
          <div className="text-xs text-blue-600 space-y-1">
            <div>• 削除されたファイルは5分間復旧可能（テスト用）</div>
            <div>• 5分経過後、このボタンで物理削除実行</div>
            <div>• 物理削除後は復旧不可能</div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onLoadFiles}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            削除済みファイル一覧表示
          </Button>
          <Button
            onClick={onCleanupExpired}
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
                {deletedFiles.map((file) => (
                  <div key={file.id} className="p-3 flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <div className="font-mono">{file.originalName}</div>
                      <div className="text-muted-foreground text-xs">
                        削除日時: {file.deletedAt ? new Date(file.deletedAt).toLocaleString('ja-JP') : '不明'}
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
                        onClick={() => onRestoreFile(file.id)}
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
  )
}
