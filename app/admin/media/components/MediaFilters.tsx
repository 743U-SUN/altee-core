"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"

interface MediaFiltersProps {
  totalCount: number
}

export function MediaFilters({ totalCount }: MediaFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [containerName, setContainerName] = useState(searchParams.get('container') || '')
  const [uploadType, setUploadType] = useState(searchParams.get('type') || '')
  const [tags, setTags] = useState(searchParams.get('tags') || '')
  const [month, setMonth] = useState(searchParams.get('month') || '')

  // 月の選択肢を生成（過去24ヶ月）
  const generateMonthOptions = () => {
    const options = []
    const now = new Date()
    
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const yearMonth = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
      const displayText = `${date.getFullYear()}年${date.getMonth() + 1}月`
      options.push({ value: yearMonth, label: displayText })
    }
    
    return options
  }

  const monthOptions = generateMonthOptions()

  const applyFilters = (overrides: Partial<{
    search: string
    containerName: string
    uploadType: string
    tags: string
    month: string
  }> = {}) => {
    const params = new URLSearchParams()
    
    const finalSearch = overrides.search !== undefined ? overrides.search : search
    const finalContainer = overrides.containerName !== undefined ? overrides.containerName : containerName
    const finalUploadType = overrides.uploadType !== undefined ? overrides.uploadType : uploadType
    const finalTags = overrides.tags !== undefined ? overrides.tags : tags
    const finalMonth = overrides.month !== undefined ? overrides.month : month
    
    if (finalSearch?.trim()) params.set('search', finalSearch.trim())
    if (finalContainer) params.set('container', finalContainer)
    if (finalUploadType) params.set('type', finalUploadType)
    if (finalTags?.trim()) params.set('tags', finalTags.trim())
    if (finalMonth) params.set('month', finalMonth)
    
    // ページをリセット
    params.delete('page')
    
    router.push(`?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setContainerName('')
    setUploadType('')
    setTags('')
    setMonth('')
    router.push('/admin/media')
  }

  // キーボードショートカット（Enter キーで検索）
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters()
    }
  }

  // アクティブなフィルターの数を計算
  const activeFiltersCount = [search, containerName, uploadType, tags, month].filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            フィルター
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount}件のフィルター適用中
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {totalCount}件のファイル
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 検索 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">ファイル名検索</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ファイル名で検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
          </div>

          {/* フォルダ名 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">フォルダ</label>
            <Select value={containerName || undefined} onValueChange={(value) => {
              const newValue = value === "all" ? "" : value
              setContainerName(newValue)
              applyFilters({ containerName: newValue })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="すべてのフォルダ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのフォルダ</SelectItem>
                <SelectItem value="article-thumbnails">article-thumbnails (記事サムネイル)</SelectItem>
                <SelectItem value="article-images">article-images (記事画像)</SelectItem>
                <SelectItem value="system-assets">system-assets (システム)</SelectItem>
                <SelectItem value="images">images (汎用画像)</SelectItem>
                <SelectItem value="user-icons">user-icons (プロフィール画像)</SelectItem>
                <SelectItem value="admin-icons">admin-icons (管理者アイコン)</SelectItem>
                <SelectItem value="backgrounds">backgrounds (背景画像)</SelectItem>
                <SelectItem value="user-links">user-links (ユーザーリンクアイコン)</SelectItem>
                <SelectItem value="admin-links">admin-links (管理者リンクアイコン)</SelectItem>
                <SelectItem value="user-notifications">user-notifications (通知画像)</SelectItem>
                <SelectItem value="user-contacts">user-contacts (連絡方法画像)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* アップロードタイプ */}
          <div className="space-y-2">
            <label className="text-sm font-medium">タイプ</label>
            <Select value={uploadType || undefined} onValueChange={(value) => {
              const newValue = value === "all" ? "" : value
              setUploadType(newValue)
              applyFilters({ uploadType: newValue })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="すべてのタイプ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのタイプ</SelectItem>
                <SelectItem value="THUMBNAIL">記事サムネイル</SelectItem>
                <SelectItem value="CONTENT">記事内画像</SelectItem>
                <SelectItem value="SYSTEM">システム</SelectItem>
                <SelectItem value="ICON">管理者アイコン</SelectItem>
                <SelectItem value="BACKGROUND">背景画像</SelectItem>
                <SelectItem value="PROFILE">プロフィール画像</SelectItem>
                <SelectItem value="LINK_ICON">リンクアイコン</SelectItem>
                <SelectItem value="NOTIFICATION">通知画像</SelectItem>
                <SelectItem value="CONTACT">連絡方法画像</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* タグ検索 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">タグ検索</label>
            <Input
              placeholder="タグをカンマ区切りで入力"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          {/* 月別フィルター */}
          <div className="space-y-2">
            <label className="text-sm font-medium">アップロード月</label>
            <Select value={month || undefined} onValueChange={(value) => {
              const newValue = value === "all" ? "" : value
              setMonth(newValue)
              applyFilters({ month: newValue })
            }}>
              <SelectTrigger>
                <SelectValue placeholder="すべての月" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての月</SelectItem>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 検索ボタンとクリアボタン */}
        <div className="flex items-center gap-2">
          <Button onClick={() => applyFilters()}>
            <Search className="mr-2 h-4 w-4" />
            検索実行
          </Button>
          {activeFiltersCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              フィルターをクリア
            </Button>
          )}
        </div>

        {/* アクティブフィルターの表示 */}
        {activeFiltersCount > 0 && (
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
                タイプ: {
                  uploadType === 'THUMBNAIL' ? '記事サムネイル' :
                  uploadType === 'CONTENT' ? '記事内画像' :
                  uploadType === 'SYSTEM' ? 'システム' :
                  uploadType === 'ICON' ? '管理者アイコン' :
                  uploadType === 'BACKGROUND' ? '背景画像' :
                  uploadType === 'PROFILE' ? 'プロフィール画像' :
                  uploadType === 'LINK_ICON' ? 'リンクアイコン' :
                  uploadType === 'NOTIFICATION' ? '通知画像' :
                  uploadType === 'CONTACT' ? '連絡方法画像' :
                  uploadType
                }
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
        )}
      </CardContent>
    </Card>
  )
}