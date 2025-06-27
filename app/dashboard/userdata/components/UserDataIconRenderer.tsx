"use client"

import { useState, useEffect } from "react"
import {
  User, Users, UserCheck, Crown, Activity, Heart, Zap, Scale,
  Star, ThumbsUp, Award, Medal, Book, Music, Camera, Coffee,
  Utensils, Dumbbell, Bike, Mountain, Waves, Home, MapPin,
  Car, Plane, Calendar, Clock, Sun, Moon, Mail, Phone,
  MessageCircle, Globe, Briefcase, GraduationCap, Code, Laptop,
  Gift, Tag, Flag, Target, Gamepad2, Palette
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getCustomIcons, type CustomIcon } from "@/app/actions/admin-icon-actions"

interface UserDataIconRendererProps {
  iconName: string
  className?: string
}

export function UserDataIconRenderer({ iconName, className = "h-6 w-6" }: UserDataIconRendererProps) {
  const [customIcons, setCustomIcons] = useState<CustomIcon[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // カスタムアイコンを読み込み
  useEffect(() => {
    const loadCustomIcons = async () => {
      try {
        const result = await getCustomIcons()
        if (result.success && result.icons) {
          setCustomIcons(result.icons)
        }
      } catch (error) {
        console.error('Failed to load custom icons:', error)
      } finally {
        setIsLoaded(true)
      }
    }
    
    loadCustomIcons()
  }, [])

  // アイコンマッピング（型安全）
  const iconMap: Record<string, LucideIcon> = {
    User, Users, UserCheck, Crown, Activity, Heart, Zap, Scale,
    Star, ThumbsUp, Award, Medal, Book, Music, Camera, Coffee,
    Utensils, Dumbbell, Bike, Mountain, Waves, Home, MapPin,
    Car, Plane, Calendar, Clock, Sun, Moon, Mail, Phone,
    MessageCircle, Globe, Briefcase, GraduationCap, Code, Laptop,
    Gift, Tag, Flag, Target, Gamepad2, Palette
  }

  const getLucideIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || User
  }

  // カスタムアイコンかどうかを判定
  const isCustomIcon = (iconName: string) => {
    return iconName.startsWith('custom:')
  }

  // カスタムアイコンのIDからアイコン情報を取得
  const getCustomIconById = (iconId: string) => {
    const id = iconId.replace('custom:', '')
    return customIcons.find(icon => icon.id === id)
  }

  // カスタムアイコンの場合
  if (isCustomIcon(iconName)) {
    if (!isLoaded) {
      // ローディング中はスケルトンまたはデフォルトアイコンを表示
      const DefaultIcon = User
      return <DefaultIcon className={className} />
    }

    const customIcon = getCustomIconById(iconName)
    if (customIcon) {
      return (
        <img 
          src={customIcon.url} 
          alt={customIcon.originalName}
          className={className}
        />
      )
    }
  }

  // Lucideアイコンの場合（デフォルト）
  const IconComponent = getLucideIcon(iconName)
  return <IconComponent className={className} />
}