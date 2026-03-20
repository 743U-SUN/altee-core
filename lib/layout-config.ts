/**
 * 後方互換 re-export（段階的移行用）
 * 新規コードは lib/config/layout-types, layout-defaults, layout-variants から直接 import してください。
 */
export { iconMap, getBrandIcon } from "./config/layout-types"
export type { IconName, NavItem, UserData, BrandConfig, SidebarConfig, HeaderConfig, MobileFooterConfig, MobileLayoutConfig, LayoutConfig, LayoutVariant, LayoutOverrides } from "./config/layout-types"
export { defaultUser, defaultBrand, defaultMobileLayout, mergeLayoutConfig } from "./config/layout-defaults"
export { layoutConfigs, getLayoutConfig } from "./config/layout-variants"
