import { User, Radio, Gamepad2, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface CharacterNavItem {
  key: string
  label: string
  icon: LucideIcon
  href: string
  exact: boolean
}

export const CHARACTER_NAV_ITEMS: CharacterNavItem[] = [
  { key: "basic", label: "基本情報", icon: User, href: "/dashboard/character", exact: true },
  { key: "activity", label: "活動情報", icon: Radio, href: "/dashboard/character/activity", exact: false },
  { key: "game", label: "ゲーム", icon: Gamepad2, href: "/dashboard/character/game", exact: false },
  { key: "collab", label: "コラボ", icon: Users, href: "/dashboard/character/collab", exact: false },
]
