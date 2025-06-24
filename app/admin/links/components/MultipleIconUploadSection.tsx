"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUploader } from "@/components/image-uploader/image-uploader"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Star, StarOff, Trash2, Upload } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { 
  createLinkTypeIcon, 
  deleteLinkTypeIcon, 
  setDefaultLinkTypeIcon,
  getLinkTypeIcons
} from "@/app/actions/link-actions"
import type { UploadedFile } from "@/types/image-upload"
import type { LinkTypeIcon } from "@/types/link-type"

interface MultipleIconUploadSectionProps {
  linkTypeId?: string
  initialIcons?: LinkTypeIcon[]
  onIconsChanged?: (icons: LinkTypeIcon[]) => void
}

export function MultipleIconUploadSection({ 
  linkTypeId, 
  initialIcons = [],
  onIconsChanged 
}: MultipleIconUploadSectionProps) {
  const [icons, setIcons] = useState<LinkTypeIcon[]>(initialIcons)

  const loadIcons = useCallback(async () => {
    if (!linkTypeId) return

    try {
      const result = await getLinkTypeIcons(linkTypeId)
      
      if (result.success) {
        setIcons(result.data || [])
        onIconsChanged?.(result.data || [])
      } else {
        toast.error(result.error || "アイコンの取得に失敗しました")
      }
    } catch (error) {
      console.error("アイコン取得エラー:", error)
      toast.error("アイコンの取得に失敗しました")
    }
  }, [linkTypeId, onIconsChanged])

  // linkTypeIdが変更された時にアイコンを再取得
  useEffect(() => {
    if (linkTypeId) {
      loadIcons()
    }
  }, [linkTypeId, loadIcons])

  const handleIconUpload = async (files: UploadedFile[]) => {
    if (!linkTypeId) {
      toast.error("リンクタイプIDが必要です")
      return
    }

    if (files.length === 0) return

    try {
      const uploadPromises = files.map(async (file, index) => {
        const isDefault = icons.length === 0 && index === 0 // 最初のアイコンの場合はデフォルトに

        return createLinkTypeIcon(linkTypeId, {
          iconKey: file.key,
          iconName: "", // 名前は空文字
          isDefault,
          sortOrder: icons.length + index
        })
      })

      const results = await Promise.all(uploadPromises)
      
      // 成功したアイコンを追加
      const newIcons = results
        .filter(result => result.success)
        .map(result => result.data!)

      if (newIcons.length > 0) {
        const updatedIcons = [...icons, ...newIcons]
        setIcons(updatedIcons)
        onIconsChanged?.(updatedIcons)
        toast.success(`アイコンを追加しました`)
      }

      // エラーがあった場合は表示
      const errors = results.filter(result => !result.success)
      if (errors.length > 0) {
        toast.error(`${errors.length}個のアイコンの追加に失敗しました`)
      }

    } catch (error) {
      console.error("アイコンアップロードエラー:", error)
      toast.error("アイコンのアップロードに失敗しました")
    }
  }

  const handleSetDefault = async (iconId: string) => {
    try {
      const result = await setDefaultLinkTypeIcon(iconId)
      
      if (result.success) {
        // ローカル状態を更新
        setIcons(prevIcons => 
          prevIcons.map(icon => ({
            ...icon,
            isDefault: icon.id === iconId
          }))
        )
        
        toast.success("メインアイコンを設定しました")
      } else {
        toast.error(result.error || "デフォルト設定に失敗しました")
      }
    } catch (error) {
      console.error("デフォルト設定エラー:", error)
      toast.error("デフォルト設定に失敗しました")
    }
  }

  const handleDeleteIcon = async (iconId: string) => {
    if (!confirm("このアイコンを削除しますか？")) return

    try {
      const result = await deleteLinkTypeIcon(iconId)
      
      if (result.success) {
        const updatedIcons = icons.filter(icon => icon.id !== iconId)
        setIcons(updatedIcons)
        onIconsChanged?.(updatedIcons)
        toast.success("アイコンを削除しました")
      } else {
        toast.error(result.error || "削除に失敗しました")
      }
    } catch (error) {
      console.error("アイコン削除エラー:", error)
      toast.error("削除に失敗しました")
    }
  }


  return (
    <div className="space-y-4">
      <Label>
        アイコン管理 <span className="text-sm text-muted-foreground">（複数設定可能）</span>
      </Label>

      {/* アイコンアップロード */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Upload className="h-4 w-4" />
            新しいアイコンを追加
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUploader
            mode="immediate"
            previewSize="small"
            maxFiles={5}
            maxSize={1024 * 1024}
            folder="admin-links"
            value={[]}
            onUpload={handleIconUpload}
            showPreview={false}
            className="min-h-[80px]"
          />
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>• 最大5個まで同時にアップロード可能</p>
            <p>• 推奨サイズ: 24x24px 以上</p>
            <p>• 対応形式: PNG, JPG, GIF, SVG</p>
          </div>
        </CardContent>
      </Card>

      {/* アイコン一覧 */}
      {icons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">登録済みアイコン ({icons.length}個)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {icons.map((icon) => (
                <div 
                  key={icon.id} 
                  className="relative border rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  {/* アイコン画像 */}
                  <div className="flex items-center justify-center h-16">
                    <Image
                      src={`/api/files/${icon.iconKey}`}
                      alt={icon.iconName}
                      width={48}
                      height={48}
                      className="object-contain"
                      unoptimized
                    />
                  </div>


                  {/* アクション */}
                  <div className="absolute top-1 right-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleSetDefault(icon.id)}
                            disabled={icon.isDefault}
                          >
                            {icon.isDefault ? (
                              <>
                                <StarOff className="mr-2 h-3 w-3" />
                                メイン設定済み
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-3 w-3" />
                                メインに設定
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteIcon(icon.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-3 w-3" />
                            削除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 説明文 */}
      {icons.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p>まだアイコンが登録されていません</p>
          <p className="text-sm">上のアップロード機能を使用してアイコンを追加しましょう</p>
        </div>
      )}
    </div>
  )
}