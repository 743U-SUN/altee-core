import type { UserData, BrandConfig, MobileLayoutConfig, LayoutConfig, LayoutOverrides } from "./layout-types"

// デフォルトユーザーデータ
export const defaultUser: UserData = {
  id: "default",
  name: "shadcn",
  email: "m@example.com",
  characterName: null,
  handle: null,
  avatar: "/avatars/shadcn.jpg",
}

// デフォルトブランド設定
export const defaultBrand: BrandConfig = {
  icon: "Command",
  iconBgColor: "bg-sidebar-primary",
  title: "Altee Core",
  subtitle: "v1.0",
  url: "/",
}

// デフォルトモバイルレイアウト設定
export const defaultMobileLayout: MobileLayoutConfig = {
  verticalLayout: false,
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
    mainClassName: overrides.mainClassName || baseConfig.mainClassName,
  }
}
