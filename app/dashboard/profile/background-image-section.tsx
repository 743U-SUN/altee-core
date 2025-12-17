'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { getBackgroundImages, updateUserProfile } from "@/app/actions/profile-actions"
import { toast } from "sonner"
import { Check } from "lucide-react"
import Image from "next/image"

interface BackgroundImage {
  id: string
  storageKey: string
  fileName: string
  originalName: string
  description: string | null
  altText: string | null
}

interface BackgroundImageSectionProps {
  currentBackgroundKey?: string | null
}

export function BackgroundImageSection({ currentBackgroundKey }: BackgroundImageSectionProps) {
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([])
  const [selectedKey, setSelectedKey] = useState<string>(currentBackgroundKey || 'none')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // 背景画像一覧を取得
  useEffect(() => {
    const fetchBackgroundImages = async () => {
      setIsLoading(true)
      try {
        const result = await getBackgroundImages()
        if (result.success && result.data) {
          setBackgroundImages(result.data)
        } else {
          toast.error(result.error || '背景画像の取得に失敗しました')
        }
      } catch (error) {
        console.error('背景画像取得エラー:', error)
        toast.error('背景画像の取得中にエラーが発生しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBackgroundImages()
  }, [])

  // 保存処理
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateUserProfile({
        backgroundImageKey: selectedKey === 'none' ? undefined : selectedKey,
      })

      if (result.success) {
        toast.success('背景画像を更新しました')
      } else {
        toast.error(result.error || '背景画像の更新に失敗しました')
      }
    } catch (error) {
      console.error('背景画像更新エラー:', error)
      toast.error('背景画像の更新中にエラーが発生しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>背景画像</CardTitle>
          <CardDescription>管理者が用意した背景画像から選択します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">読み込み中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (backgroundImages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>背景画像</CardTitle>
          <CardDescription>管理者が用意した背景画像から選択します</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">現在、利用可能な背景画像はありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>背景画像</CardTitle>
        <CardDescription>管理者が用意した背景画像から選択します</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedKey} onValueChange={setSelectedKey}>
          {/* 背景なしオプション */}
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">なし</span>
                </div>
                <div>
                  <p className="font-medium">背景画像なし</p>
                  <p className="text-sm text-muted-foreground">デフォルトの背景を使用します</p>
                </div>
              </div>
            </Label>
            {selectedKey === 'none' && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </div>

          {/* 背景画像オプション */}
          {backgroundImages.map((bg) => (
            <div
              key={bg.id}
              className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer"
            >
              <RadioGroupItem value={bg.storageKey} id={bg.storageKey} />
              <Label htmlFor={bg.storageKey} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-16 rounded overflow-hidden bg-muted">
                    <Image
                      src={`/api/files/${bg.storageKey}`}
                      alt={bg.altText || bg.originalName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{bg.originalName}</p>
                    {bg.description && (
                      <p className="text-sm text-muted-foreground">{bg.description}</p>
                    )}
                  </div>
                </div>
              </Label>
              {selectedKey === bg.storageKey && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          ))}
        </RadioGroup>

        <Button
          onClick={handleSave}
          disabled={isSaving || selectedKey === currentBackgroundKey}
          className="w-full"
        >
          {isSaving ? '保存中...' : '背景画像を保存'}
        </Button>
      </CardContent>
    </Card>
  )
}
