"use client"

import { useState } from "react"
import useSWR from "swr"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { COMMON_ICONS } from "@/types/userdata"
import {
  User, Users, UserCheck, Crown, Activity, Heart, Zap, Scale,
  Star, ThumbsUp, Award, Medal, Book, Music, Camera, Coffee,
  Utensils, Dumbbell, Bike, Mountain, Waves, Home, MapPin,
  Car, Plane, Calendar, Clock, Sun, Moon, Mail, Phone,
  MessageCircle, Globe, Briefcase, GraduationCap, Code, Laptop,
  Gift, Tag, Flag, Target, Gamepad2, Palette, Search
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useCustomIcons } from "@/hooks/use-custom-icons"
import { getIconTags } from "@/app/actions/admin/icon-actions"

const fetchIconTags = async (): Promise<string[]> => {
  const result = await getIconTags()
  return result.success && result.tags ? result.tags : []
}

// アイコンマッピング（型安全）- モジュールレベルでホイスト
const ICON_MAP: Record<string, LucideIcon> = {
  User, Users, UserCheck, Crown, Activity, Heart, Zap, Scale,
  Star, ThumbsUp, Award, Medal, Book, Music, Camera, Coffee,
  Utensils, Dumbbell, Bike, Mountain, Waves, Home, MapPin,
  Car, Plane, Calendar, Clock, Sun, Moon, Mail, Phone,
  MessageCircle, Globe, Briefcase, GraduationCap, Code, Laptop,
  Gift, Tag, Flag, Target, Gamepad2, Palette
}

interface IconSelectorProps {
  selectedIcon: string
  onIconSelect: (iconName: string) => void
}

export function IconSelector({ selectedIcon, onIconSelect }: IconSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("lucide")

  const { data: customIcons = [], isLoading } = useCustomIcons()
  const { data: availableTags = [] } = useSWR('icon-tags', fetchIconTags)

  // Lucideアイコンの検索フィルタリング
  const filteredLucideIcons = COMMON_ICONS.filter(icon =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // カスタムアイコンの検索・タグフィルタリング
  const filteredCustomIcons = customIcons.filter(icon => {
    const matchesSearch = searchTerm === "" ||
      icon.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      icon.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.every(tag => icon.tags.includes(tag))

    return matchesSearch && matchesTags
  })

  const getIconComponent = (iconName: string): LucideIcon => {
    return ICON_MAP[iconName] || User
  }

  // タグの選択/解除
  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // 選択されたアイコンがカスタムアイコンかどうかを判定
  const isCustomIcon = (iconName: string) => {
    return iconName.startsWith('custom:')
  }

  return (
    <div className="space-y-4">
      {/* 現在選択されているアイコンの表示 */}
      {selectedIcon && !isCustomIcon(selectedIcon) && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <div className="flex-shrink-0">
            {(() => {
              const IconComponent = getIconComponent(selectedIcon)
              return <IconComponent className="h-6 w-6" />
            })()}
          </div>
          <div>
            <div className="font-medium text-sm">
              {COMMON_ICONS.find(icon => icon.name === selectedIcon)?.label || selectedIcon}
            </div>
            <div className="text-xs text-muted-foreground">選択中のアイコン</div>
          </div>
        </div>
      )}

      {/* 検索フィールド */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="アイコンを検索..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* タブでアイコンタイプを選択 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lucide">Lucideアイコン</TabsTrigger>
          <TabsTrigger value="custom">カスタムアイコン</TabsTrigger>
        </TabsList>

        <TabsContent value="lucide" className="space-y-4">
          {/* Lucideアイコン一覧 */}
          <ScrollArea className="h-64 border rounded-lg">
            <div className="grid grid-cols-8 gap-2 p-4">
              {filteredLucideIcons.map((icon) => {
                const IconComponent = getIconComponent(icon.name)
                const isSelected = selectedIcon === icon.name

                return (
                  <Button
                    key={icon.name}
                    type="button"
                    variant={isSelected ? "default" : "ghost"}
                    size="sm"
                    className="h-10 w-10 flex items-center justify-center p-2"
                    onClick={() => onIconSelect(icon.name)}
                    title={icon.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Button>
                )
              })}
            </div>
          </ScrollArea>

          {/* Lucideアイコン検索結果がない場合 */}
          {filteredLucideIcons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>「{searchTerm}」に一致するアイコンが見つかりませんでした</p>
              <p className="text-sm mt-1">別の検索語を試してください</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          {/* タグフィルター */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">タグで絞り込み</div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-primary/80 flex items-center justify-center text-center leading-none pb-1.5"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
              {selectedTags.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                >
                  すべてクリア
                </Button>
              )}
            </div>
          )}

          {/* カスタムアイコン一覧 */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>アイコンを読み込み中...</p>
            </div>
          ) : (
            <ScrollArea className="h-64 border rounded-lg">
              <div className="grid grid-cols-8 gap-2 p-4">
                {filteredCustomIcons.map((icon) => {
                  const isSelected = selectedIcon === `custom:${icon.id}`

                  return (
                    <Button
                      key={icon.id}
                      type="button"
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className="h-10 w-10 flex items-center justify-center p-2"
                      onClick={() => onIconSelect(`custom:${icon.id}`)}
                      title={icon.originalName}
                    >
                      <Image
                        src={icon.url}
                        alt={icon.originalName}
                        width={20}
                        height={20}
                        unoptimized
                        className="h-5 w-5 object-contain"
                      />
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          )}

          {/* カスタムアイコン検索結果がない場合 */}
          {!isLoading && filteredCustomIcons.length === 0 && customIcons.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>フィルター条件に一致するアイコンが見つかりませんでした</p>
              <p className="text-sm mt-1">検索語やタグを変更してください</p>
            </div>
          )}

          {/* カスタムアイコンが1つもない場合 */}
          {!isLoading && customIcons.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>カスタムアイコンがアップロードされていません</p>
              <p className="text-sm mt-1">管理画面からアイコンをアップロードしてください</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ヘルプテキスト */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• アイコンをクリックして選択してください</p>
        <p>• 検索ボックスでアイコンを素早く見つけられます</p>
        <p>• Lucide: {COMMON_ICONS.length}種類、カスタム: {customIcons.length}種類のアイコンから選択可能</p>
        {activeTab === "custom" && availableTags.length > 0 && (
          <p>• タグをクリックして絞り込みができます</p>
        )}
      </div>
    </div>
  )
}
