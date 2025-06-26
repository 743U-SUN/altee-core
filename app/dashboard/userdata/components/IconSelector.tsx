"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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

interface IconSelectorProps {
  selectedIcon: string
  onIconSelect: (iconName: string) => void
}

export function IconSelector({ selectedIcon, onIconSelect }: IconSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  // 検索フィルタリング
  const filteredIcons = COMMON_ICONS.filter(icon =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // アイコンマッピング（型安全）
  const iconMap: Record<string, LucideIcon> = {
    User, Users, UserCheck, Crown, Activity, Heart, Zap, Scale,
    Star, ThumbsUp, Award, Medal, Book, Music, Camera, Coffee,
    Utensils, Dumbbell, Bike, Mountain, Waves, Home, MapPin,
    Car, Plane, Calendar, Clock, Sun, Moon, Mail, Phone,
    MessageCircle, Globe, Briefcase, GraduationCap, Code, Laptop,
    Gift, Tag, Flag, Target, Gamepad2, Palette
  }

  const getIconComponent = (iconName: string): LucideIcon => {
    return iconMap[iconName] || User
  }

  return (
    <div className="space-y-4">
      {/* 現在選択されているアイコンの表示 */}
      {selectedIcon && (
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

      {/* アイコン一覧 */}
      <ScrollArea className="h-64 border rounded-lg">
        <div className="grid grid-cols-8 gap-2 p-4">
          {filteredIcons.map((icon) => {
            const IconComponent = getIconComponent(icon.name)
            const isSelected = selectedIcon === icon.name
            
            return (
              <Button
                key={icon.name}
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

      {/* 検索結果がない場合 */}
      {filteredIcons.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>「{searchTerm}」に一致するアイコンが見つかりませんでした</p>
          <p className="text-sm mt-1">別の検索語を試してください</p>
        </div>
      )}

      {/* ヘルプテキスト */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• アイコンをクリックして選択してください</p>
        <p>• 検索ボックスでアイコンを素早く見つけられます</p>
        <p>• 全{COMMON_ICONS.length}種類のアイコンから選択可能です</p>
      </div>
    </div>
  )
}