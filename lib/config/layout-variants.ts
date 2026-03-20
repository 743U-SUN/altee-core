import { Home, Users, Link, Tag, NotebookPen, Image, BarChart3, Shield, UserCircle, CogIcon, Palette, Sparkles } from "lucide-react"
import type { NavItem, LayoutConfig, LayoutVariant } from "./layout-types"
import { defaultUser, defaultBrand, defaultMobileLayout } from "./layout-defaults"

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
    title: "Attributes",
    url: "/admin/attributes",
    icon: Tag,
    isActive: false,
  },
  {
    title: "Backgrounds",
    url: "/admin/section-backgrounds",
    icon: Palette,
    isActive: false,
  }
]

const dashboardNavItems: NavItem[] = [
  {
    title: "プロフィールエディター",
    url: "/dashboard/profile-editor",
    icon: UserCircle,
    isActive: false,
  },
  {
    title: "キャラクター",
    url: "/dashboard/character",
    icon: Sparkles,
    isActive: false,
  },
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
        icon: "Shield",
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
        icon: "UserCircle",
        iconBgColor: "bg-blue-600",
        title: "User Profile",
        subtitle: "Settings",
        url: "/profile",
      },
      navItems: [], // デフォルトは空配列、動的に設定される
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
        icon: "Building",
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
        icon: "Settings",
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
