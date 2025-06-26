import { Home, Users, Link, Tag, Settings, Image, BarChart3, Shield, UserCircle, Command, Building, NotebookPen, Share2, HelpCircle, CogIcon } from "lucide-react"

// 型定義
export interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  isActive?: boolean
}

export interface UserData {
  name: string
  email: string
  avatar: string
}

export interface BrandConfig {
  icon: React.ComponentType<{ className?: string }>
  iconBgColor?: string
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
  titleUrl?: string
  titleIconBgColor?: string
  rightContent?: React.ReactNode
  hideUserMenu?: boolean
  hideNotifications?: boolean
  hideSidebarTrigger?: boolean
  hideModeToggle?: boolean
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
}

export type LayoutVariant = 'default' | 'admin' | 'user-profile' | 'public' | 'minimal' | 'dashboard'

export interface LayoutOverrides {
  firstSidebar?: Partial<SidebarConfig>
  secondSidebar?: Partial<{ content?: React.ReactNode }>
  header?: Partial<HeaderConfig>
  mobileFooter?: Partial<MobileFooterConfig>
  mobileLayout?: Partial<MobileLayoutConfig>
  sidebarWidth?: string
}

// デフォルトユーザーデータ
export const defaultUser: UserData = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
}

// デフォルトブランド設定
export const defaultBrand: BrandConfig = {
  icon: Command,
  iconBgColor: "bg-sidebar-primary",
  title: "Altee Core",
  subtitle: "v1.0",
  url: "/",
}

// デフォルトモバイルレイアウト設定
export const defaultMobileLayout: MobileLayoutConfig = {
  verticalLayout: false,
}

// ナビゲーション項目の定義
const defaultNavItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    isActive: true,
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Shield,
    isActive: false,
  },
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: CogIcon,
    isActive: false,
  }  
]

const adminNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: BarChart3,
    isActive: true,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
    isActive: false,
  },
  {
    title: "Links",
    url: "/admin/links",
    icon: Link,
    isActive: false,
  },  
  {
    title: "Article",
    url: "/admin/articles",
    icon: NotebookPen,
    isActive: false,
  },
  {
    title: "Media",
    url: "/admin/media",
    icon: Image,
    isActive: false,
  },
  {
    title: "Attirbutes",
    url: "/admin/attributes",
    icon: Tag,
    isActive: false,
  }
]

const userProfileNavItems: NavItem[] = [
  {
    title: "Profile",
    url: "/profile",
    icon: UserCircle,
    isActive: true,
  },
  {
    title: "Settings",
    url: "/profile/settings",
    icon: Settings,
    isActive: false,
  }
]

const dashboardNavItems: NavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Settings,
    isActive: true,
  },
  {
    title: "プロフィール",
    url: "/dashboard/profile",
    icon: UserCircle,
    isActive: false,
  },
  {
    title: "SNSリンク",
    url: "/dashboard/links",
    icon: Share2,
    isActive: false,
  },
  {
    title: "FAQ管理",
    url: "/dashboard/faq",
    icon: HelpCircle,
    isActive: false,
  },
  {
    title: "Home",
    url: "/",
    icon: Home,
    isActive: false,
  }
]

// バリアント設定の定義
export const layoutConfigs: Record<LayoutVariant, LayoutConfig> = {
  default: {
    sidebarWidth: "350px",
    firstSidebar: {
      brand: defaultBrand,
      navItems: defaultNavItems,
      user: defaultUser,
      hideUser: false,
    },
    secondSidebar: {},
    header: {
      title: "ALTEE",
      titleIcon: Home,
      titleUrl: "/",
      titleIconBgColor: "bg-transparent",
      hideUserMenu: false,
      hideNotifications: false,
      hideSidebarTrigger: false,
      hideModeToggle: false,
    },
    mobileFooter: {
      hide: false,
    },
    mobileLayout: defaultMobileLayout,
  },

  admin: {
    sidebarWidth: "400px",
    firstSidebar: {
      brand: {
        icon: Shield,
        iconBgColor: "bg-red-600",
        title: "Admin Panel",
        subtitle: "System",
        url: "/admin",
      },
      navItems: adminNavItems,
      user: defaultUser,
      hideUser: false,
    },
    secondSidebar: {},
    header: {
      title: "Admin Panel",
      hideUserMenu: false,
      hideNotifications: false,
      hideSidebarTrigger: false,
      hideModeToggle: false,
    },
    mobileFooter: {
      hide: false,
    },
    mobileLayout: defaultMobileLayout,
  },

  "user-profile": {
    sidebarWidth: "720px",
    firstSidebar: {
      brand: {
        icon: UserCircle,
        iconBgColor: "bg-blue-600",
        title: "User Profile",
        subtitle: "Settings",
        url: "/profile",
      },
      navItems: userProfileNavItems,
      user: defaultUser,
      hideUser: false,
    },
    secondSidebar: {},
    header: {
      title: "プロフィール",
      hideUserMenu: false,
      hideNotifications: false,
      hideSidebarTrigger: true, // 縦並びレイアウトではトグルボタン非表示
      hideModeToggle: false,
    },
    mobileFooter: {
      hide: false,
    },
    mobileLayout: {
      verticalLayout: true,
    },
  },

  public: {
    sidebarWidth: "280px",
    firstSidebar: {
      brand: {
        icon: Building,
        iconBgColor: "bg-green-600",
        title: "Public Site",
        subtitle: "Welcome",
        url: "/",
      },
      navItems: [
        {
          title: "Home",
          url: "/",
          icon: Home,
          isActive: true,
        }
      ],
      hideUser: true,
    },
    secondSidebar: {},
    header: {
      title: "Welcome",
      hideUserMenu: true,
      hideNotifications: true,
      hideSidebarTrigger: true,
      hideModeToggle: false,
    },
    mobileFooter: {
      hide: false,
    },
    mobileLayout: defaultMobileLayout,
  },

  minimal: {
    sidebarWidth: "250px",
    firstSidebar: {
      hide: true,
    },
    secondSidebar: {},
    header: {
      title: "",
      hideUserMenu: true,
      hideNotifications: true,
      hideSidebarTrigger: true,
      hideModeToggle: false,
    },
    mobileFooter: {
      hide: true,
    },
    mobileLayout: defaultMobileLayout,
  },

  dashboard: {
    sidebarWidth: "350px",
    firstSidebar: {
      brand: {
        icon: Settings,
        iconBgColor: "bg-blue-600",
        title: "Dashboard",
        subtitle: "Settings",
        url: "/dashboard",
      },
      navItems: dashboardNavItems,
      user: defaultUser,
      hideUser: false,
    },
    secondSidebar: {},
    header: {
      title: "ダッシュボード",
      hideUserMenu: false,
      hideNotifications: false,
      hideSidebarTrigger: false,
      hideModeToggle: false,
    },
    mobileFooter: {
      hide: false,
    },
    mobileLayout: defaultMobileLayout,
  },
}

// 設定取得関数
export function getLayoutConfig(variant: LayoutVariant): LayoutConfig {
  const config = layoutConfigs[variant]

  if (!config) {
    console.warn(`Unknown layout variant: ${variant}. Using default.`)
    return layoutConfigs.default
  }

  return config
}

// 設定マージ関数
export function mergeLayoutConfig(
  baseConfig: LayoutConfig,
  overrides?: LayoutOverrides
): LayoutConfig {
  if (!overrides) return baseConfig

  return {
    firstSidebar: {
      ...baseConfig.firstSidebar,
      ...overrides.firstSidebar,
    },
    secondSidebar: {
      ...baseConfig.secondSidebar,
      ...overrides.secondSidebar,
    },
    header: {
      ...baseConfig.header,
      ...overrides.header,
    },
    mobileFooter: {
      ...baseConfig.mobileFooter,
      ...overrides.mobileFooter,
    },
    mobileLayout: {
      ...baseConfig.mobileLayout,
      ...overrides.mobileLayout,
    },
    sidebarWidth: overrides.sidebarWidth || baseConfig.sidebarWidth,
  }
}