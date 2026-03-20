'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, HardDrive, Database, FileX } from 'lucide-react'

interface Stats {
  storageFiles: number
  dbFiles: number
  orphanFiles: number
  orphanSizeMB: number
  folders: Record<string, number>
}

interface StorageStatsCardProps {
  stats: Stats | null
  loading: boolean
  onRefresh: () => void
}

export function StorageStatsCard({ stats, loading, onRefresh }: StorageStatsCardProps) {
  return (
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
            onClick={onRefresh}
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
            <h3 className="font-semibold mb-2">フォルダ別ファイル数</h3>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(stats.folders).map(([folder, count]) => (
                <Badge key={folder} variant="outline">
                  {folder}: {count}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
