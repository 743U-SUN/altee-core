"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Image from "next/image"
import { getLinkTypeIcons } from "@/app/actions/link-actions"
import type { LinkTypeIcon } from "@/types/link-type"

interface PresetIconSelectorProps {
  linkTypeId: string
  selectedIconId?: string | null
  onIconSelected: (iconId: string) => void
}

export function PresetIconSelector({ 
  linkTypeId, 
  selectedIconId, 
  onIconSelected 
}: PresetIconSelectorProps) {
  const [icons, setIcons] = useState<LinkTypeIcon[]>([])
  const [loading, setLoading] = useState(false)

  const loadIcons = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getLinkTypeIcons(linkTypeId)
      
      if (result.success) {
        setIcons(result.data || [])
      } else {
        console.error("アイコン取得エラー:", result.error)
      }
    } catch (error) {
      console.error("アイコン取得エラー:", error)
    } finally {
      setLoading(false)
    }
  }, [linkTypeId])

  useEffect(() => {
    if (linkTypeId) {
      loadIcons()
    }
  }, [linkTypeId, loadIcons])

  const handleIconSelect = (iconId: string) => {
    onIconSelected(iconId)
    // toastは親コンポーネントで表示するため削除
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            アイコンを読み込み中...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (icons.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            このサービスにはアイコンが設定されていません
          </div>
        </CardContent>
      </Card>
    )
  }

  // デフォルトアイコンを最初に表示
  const sortedIcons = [...icons].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1
    if (!a.isDefault && b.isDefault) return 1
    return a.sortOrder - b.sortOrder
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          アイコンを選択 <span className="text-muted-foreground">({icons.length}個)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {sortedIcons.map((icon) => (
            <Button
              key={icon.id}
              type="button"
              variant={selectedIconId === icon.id ? "default" : "outline"}
              className="relative h-16 w-full p-2"
              onClick={() => handleIconSelect(icon.id)}
            >
              {/* アイコン画像 */}
              <div className="flex items-center justify-center h-full w-full">
                <Image
                  src={`/api/files/${icon.iconKey}`}
                  alt="アイコン"
                  width={32}
                  height={32}
                  className="object-contain"
                  unoptimized
                />
              </div>
              
              {/* 選択済みマーク */}
              {selectedIconId === icon.id && (
                <div className="absolute top-1 right-1">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              
            </Button>
          ))}
        </div>
        
        {/* 説明 */}
        <div className="mt-3 text-xs text-muted-foreground text-center">
          <span>クリックで選択</span>
        </div>
      </CardContent>
    </Card>
  )
}