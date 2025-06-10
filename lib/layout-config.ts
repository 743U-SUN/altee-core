import { Home, Users, Settings, BarChart3, Shield, UserCircle, Command, Building } from "lucide-react"

// 型定義
export interface NavItem {
  title: string
  url: string
  icon: any
  isActive?: boolean
}

export interface UserData {
  name: string
  email: string
  avatar: string
}

export interface BrandConfig {
  icon: any
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
  rightContent?: React.ReactNode
  hideUserMenu?: boolean
  showNotifications?: boolean
}

export interface LayoutConfig {
  firstSidebar: SidebarConfig
  secondSidebar: {
    content?: React.ReactNode
    hide?: boolean
  }
  header: HeaderConfig
  sidebarWidth?: string
}

export type LayoutVariant = 'default' | 'admin' | 'user-profile' | 'public' | 'minimal'

export interface LayoutOverrides {
  firstSidebar?: Partial<SidebarConfig>
  secondSidebar?: Partial<{ content?: React.ReactNode; hide?: boolean }>
  header?: Partial<HeaderConfig>
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

// ナビゲーション項目の定義
const defaultNavItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    isActive: true,
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
    title: "System",
    url: "/admin/system",
    icon: Shield,
    isActive: false,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
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
    secondSidebar: {
      hide: true,
    },
    header: {
      title: "Dashboard",
      hideUserMenu: false,
      showNotifications: true,
    },
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
    secondSidebar: {
      hide: true, // 後でAdminToolsコンポーネントを作成
    },
    header: {
      title: "Admin Panel",
      hideUserMenu: false,
      showNotifications: true,
    },
  },

  "user-profile": {
    sidebarWidth: "300px",
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
    secondSidebar: {
      hide: true, // 後でProfileSettingsコンポーネントを作成
    },
    header: {
      title: "My Profile",
      hideUserMenu: false,
      showNotifications: true,
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
    secondSidebar: {
      hide: true,
    },
    header: {
      title: "Welcome",
      hideUserMenu: true,
      showNotifications: false,
    },
  },

  minimal: {
    sidebarWidth: "250px",
    firstSidebar: {
      hide: true,
    },
    secondSidebar: {
      hide: true,
    },
    header: {
      title: "",
      hideUserMenu: true,
      showNotifications: false,
    },
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
  }
}