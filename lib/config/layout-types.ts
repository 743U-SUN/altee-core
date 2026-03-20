import { Home, Users, MonitorSmartphone, Link, Bell, Tag, Logs, Settings, Image, BarChart3, Shield, UserCircle, Command, Building, NotebookPen, Share2, HelpCircle, CogIcon, Tv, Video, Palette, Sparkles } from "lucide-react"
import type { UserNotification } from "@/types/notifications"
import type { UserContact } from "@/types/contacts"

// アイコンマッピング
export const iconMap = {
  Home,
  Users,
  Link,
  Tag,
  Logs,
  Bell,
  Settings,
  Image,
  BarChart3,
  Shield,
  UserCircle,
  Command,
  Building,
  NotebookPen,
  Share2,
  HelpCircle,
  CogIcon,
  MonitorSmartphone,
  Tv,
  Video,
  Palette,
  Sparkles,
} as const

export type IconName = keyof typeof iconMap

// アイコンを解決する関数
export function getBrandIcon(icon: IconName | React.ComponentType<{ className?: string }>) {
  if (typeof icon === 'string') {
    return iconMap[icon]
  }
  return icon
}

// 型定義
export interface NavItem {
  title: string
  url: string
  icon: IconName | React.ComponentType<{ className?: string }>
  isActive?: boolean
}

export interface UserData {
  id: string
  name: string | null
  email: string | null
  characterName: string | null
  handle: string | null
  avatar: string | null
  role?: string | null
}

export interface BrandConfig {
  icon: IconName | React.ComponentType<{ className?: string }>
  iconBgColor?: string
  brandImage?: string
  title: string
  subtitle: string
  url?: string
}

export interface SidebarConfig {
  brand?: BrandConfig
  navItems?: NavItem[]
  user?: UserData
  hideUser?: boolean
  hide?: boolean
}

export interface HeaderConfig {
  title?: string
  titleIcon?: React.ComponentType<{ className?: string }>
  titleImage?: string
  titleUrl?: string
  titleIconBgColor?: string
  rightContent?: React.ReactNode
  hideUserMenu?: boolean
  hideNotifications?: boolean
  hideSidebarTrigger?: boolean
  hideModeToggle?: boolean
  user?: UserData | null
  notificationData?: {
    userId: string
    notification: UserNotification | null
    contact: UserContact | null
  }
}

export interface MobileFooterConfig {
  hide?: boolean
}

export interface MobileLayoutConfig {
  verticalLayout?: boolean
}

export interface LayoutConfig {
  firstSidebar: SidebarConfig
  secondSidebar: {
    content?: React.ReactNode
  }
  header: HeaderConfig
  mobileFooter: MobileFooterConfig
  mobileLayout: MobileLayoutConfig
  sidebarWidth?: string
  mainClassName?: string
}

export type LayoutVariant = 'default' | 'admin' | 'user-profile' | 'public' | 'minimal' | 'dashboard'

export interface LayoutOverrides {
  firstSidebar?: Partial<SidebarConfig>
  secondSidebar?: Partial<{ content?: React.ReactNode }>
  header?: Partial<HeaderConfig>
  mobileFooter?: Partial<MobileFooterConfig>
  mobileLayout?: Partial<MobileLayoutConfig>
  sidebarWidth?: string
  mainClassName?: string
}
