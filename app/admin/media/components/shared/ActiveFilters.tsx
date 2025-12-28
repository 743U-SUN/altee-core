"use client"

import { Badge } from "@/components/ui/badge"

interface ActiveFiltersProps {
  search?: string
  containerName?: string
  uploadType?: string
  tags?: string
  month?: string
  monthOptions: { value: string; label: string }[]
}

const uploadTypeLabels: Record<string, string> = {
  'THUMBNAIL': '記事サムネイル',
  'CONTENT': '記事内画像',
  'SYSTEM': 'システム',
  'ICON': '管理者アイコン',
  'BACKGROUND': '背景画像',
  'PROFILE': 'プロフィール画像',
  'LINK_ICON': 'リンクアイコン',
  'NOTIFICATION': '通知画像',
  'CONTACT': '連絡方法画像'
}

export function ActiveFilters({
  search,
  containerName,
  uploadType,
  tags,
  month,
  monthOptions
}: ActiveFiltersProps) {
  const hasActiveFilters = search || containerName || uploadType || tags || month

  if (!hasActiveFilters) return null

  return (
    <div className="flex flex-wrap gap-2">
      {search && (
        <Badge variant="secondary">
          検索: {search}
        </Badge>
      )}
      {containerName && (
        <Badge variant="secondary">
          フォルダ: {containerName}
        </Badge>
      )}
      {uploadType && (
        <Badge variant="secondary">
          タイプ: {uploadTypeLabels[uploadType] || uploadType}
        </Badge>
      )}
      {tags && (
        <Badge variant="secondary">
          タグ: {tags}
        </Badge>
      )}
      {month && (
        <Badge variant="secondary">
          月: {monthOptions.find(opt => opt.value === month)?.label}
        </Badge>
      )}
    </div>
  )
}
