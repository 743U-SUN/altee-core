'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { detectOrphanFiles, cleanupOrphanFiles, getDeletionStats } from '@/app/actions/admin/cleanup-actions'
import { cleanupExpiredFiles, getDeletedMediaFiles, restoreMediaFile } from '@/app/actions/media/media-actions'
import { StorageStatsCard } from './StorageStatsCard'
import { OrphanFilesCard } from './OrphanFilesCard'
import { SoftDeletedFilesCard } from './SoftDeletedFilesCard'

interface OrphanFile {
  container: string
  key: string
  size: number
  lastModified: string
  storageKey: string
}

interface DeletedFile {
  id: string
  originalName: string
  deletedAt: Date | null
  scheduledDeletionAt?: Date | null
  containerName: string
}

interface Stats {
  storageFiles: number
  dbFiles: number
  orphanFiles: number
  orphanSizeMB: number
  folders: Record<string, number>
}

type DialogType = 'cleanupOrphans' | 'cleanupExpired' | 'restoreFile' | null

export function CleanupClient() {
  const [orphanFiles, setOrphanFiles] = useState<OrphanFile[]>([])
  const [deletedFiles, setDeletedFiles] = useState<DeletedFile[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [expiredCleanupLoading, setExpiredCleanupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const [dialogType, setDialogType] = useState<DialogType>(null)
  const [pendingRestoreId, setPendingRestoreId] = useState<string | null>(null)

  const handleDetectOrphans = async () => {
    setLoading(true)
    try {
      const result = await detectOrphanFiles()
      if (result.success) {
        setOrphanFiles(result.orphans)
        toast.success(`孤立ファイル検出完了: ${result.count}件`)
      } else {
        toast.error('孤立ファイルの検出に失敗しました')
      }
    } catch {
      toast.error('孤立ファイルの検出に失敗しました')
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
        toast.error('統計情報の取得に失敗しました')
      }
    } catch {
      toast.error('統計情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupOrphans = () => {
    if (orphanFiles.length === 0) {
      toast.error('削除対象の孤立ファイルがありません')
      return
    }
    setDialogType('cleanupOrphans')
  }

  const handleCleanupOrphansConfirm = async () => {
    setDialogType(null)
    setCleanupLoading(true)
    try {
      const orphanKeys = orphanFiles.map(f => f.storageKey)
      const result = await cleanupOrphanFiles(orphanKeys)

      if (result.success) {
        toast.success(`${result.deletedCount}個のファイルを削除しました`)
        if (result.errors && result.errors.length > 0) {
          toast.error(`一部エラー: ${result.errors.length}件`)
        }
        await handleDetectOrphans()
      } else {
        toast.error('孤立ファイルの削除に失敗しました')
      }
    } catch {
      toast.error('孤立ファイルの削除に失敗しました')
    } finally {
      setCleanupLoading(false)
    }
  }

  const handleLoadDeletedFiles = async () => {
    setLoading(true)
    try {
      const result = await getDeletedMediaFiles()
      setDeletedFiles(result.mediaFiles)
      toast.success(`削除済みファイル: ${result.mediaFiles.length}件`)
    } catch {
      toast.error('削除済みファイルの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupExpiredFiles = () => {
    setDialogType('cleanupExpired')
  }

  const handleCleanupExpiredConfirm = async () => {
    setDialogType(null)
    setExpiredCleanupLoading(true)
    try {
      const result = await cleanupExpiredFiles()

      if (result.success) {
        toast.success(result.message)
        if (result.errors && result.errors.length > 0) {
          toast.error(`一部エラー: ${result.errors.length}件`)
        }
        await handleGetStats()
        await handleLoadDeletedFiles()
      }
    } catch {
      toast.error('期限切れファイルの削除に失敗しました')
    } finally {
      setExpiredCleanupLoading(false)
    }
  }

  const handleRestoreFile = (fileId: string) => {
    setPendingRestoreId(fileId)
    setDialogType('restoreFile')
  }

  const handleRestoreConfirm = async () => {
    if (!pendingRestoreId) return
    const fileId = pendingRestoreId
    setPendingRestoreId(null)
    setDialogType(null)
    setRestoreLoading(true)
    try {
      const result = await restoreMediaFile(fileId)

      if (result.success) {
        toast.success('ファイルを復旧しました')
        await handleLoadDeletedFiles()
        await handleGetStats()
      }
    } catch {
      toast.error('ファイルの復旧に失敗しました')
    } finally {
      setRestoreLoading(false)
    }
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
        <Link href="/admin/media">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            メディア管理に戻る
          </Button>
        </Link>
      </div>

      <StorageStatsCard
        stats={stats}
        loading={loading}
        onRefresh={handleGetStats}
      />

      <OrphanFilesCard
        orphanFiles={orphanFiles}
        loading={loading}
        cleanupLoading={cleanupLoading}
        onDetect={handleDetectOrphans}
        onCleanup={handleCleanupOrphans}
      />

      <SoftDeletedFilesCard
        deletedFiles={deletedFiles}
        loading={loading}
        expiredCleanupLoading={expiredCleanupLoading}
        restoreLoading={restoreLoading}
        onLoadFiles={handleLoadDeletedFiles}
        onCleanupExpired={handleCleanupExpiredFiles}
        onRestoreFile={handleRestoreFile}
      />

      {/* 孤立ファイル削除確認ダイアログ */}
      <AlertDialog
        open={dialogType === 'cleanupOrphans'}
        onOpenChange={(open) => { if (!open) setDialogType(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{orphanFiles.length}個の孤立ファイルを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanupOrphansConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 期限切れファイル物理削除確認ダイアログ */}
      <AlertDialog
        open={dialogType === 'cleanupExpired'}
        onOpenChange={(open) => { if (!open) setDialogType(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>期限切れ論理削除ファイルを物理削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanupExpiredConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ファイル復旧確認ダイアログ */}
      <AlertDialog
        open={dialogType === 'restoreFile'}
        onOpenChange={(open) => { if (!open) { setDialogType(null); setPendingRestoreId(null) } }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>このファイルを復旧しますか？</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm}>
              復旧
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
