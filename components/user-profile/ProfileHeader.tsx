'use client'

import { memo, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  User,
  Video,
  HelpCircle,
  Gift,
  Mail,
  Bell,
  Package,
  Gamepad2,
  Pencil,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import type { ThemeSettings } from '@/types/profile-sections'
import type { CSSProperties } from 'react'

interface ProfileHeaderProps {
  handle: string
  avatarImageUrl?: string | null // アイコン画像（1:1正方形、ヘッダー・ネームカード用）
  characterName?: string | null
  visibility: ThemeSettings['visibility']
  namecard?: ThemeSettings['namecard']
  isEditable?: boolean
  inDashboard?: boolean // ダッシュボード内の場合はtop-17、公開ページの場合はtop-0
  onImageEdit?: (type: 'banner' | 'character' | 'profile') => void
  onNotificationClick?: (type: 'gift' | 'mail' | 'bell') => void
}

/**
 * プロフィールページのヘッダー（PC表示のみ）
 * ナビゲーションタブ + アクションアイコン
 */
export const ProfileHeader = memo(function ProfileHeader({
  handle,
  avatarImageUrl,
  characterName,
  visibility,
  namecard,
  isEditable = false,
  inDashboard = false,
  onImageEdit,
  onNotificationClick,
}: ProfileHeaderProps) {
  const pathname = usePathname()

  const navItems = useMemo(() => inDashboard ? [
    { label: 'Profile', href: '/dashboard/profile-editor', icon: User },
    { label: 'Items', href: '/dashboard/items', icon: Package },
    { label: 'Videos', href: '/dashboard/platforms', icon: Video },
    { label: 'FAQs', href: '/dashboard/faqs', icon: HelpCircle },
  ] : [
    { label: 'Profile', href: `/@${handle}`, icon: User },
    { label: 'Items', href: `/@${handle}/items`, icon: Package },
    { label: 'Videos', href: `/@${handle}/videos`, icon: Video },
    { label: 'FAQs', href: `/@${handle}/faqs`, icon: HelpCircle },
  ], [inDashboard, handle])

  // ネームカード背景スタイルを計算
  const namecardStyle = useMemo((): CSSProperties => {
    if (!namecard) return {}
    if (namecard.type === 'color' && namecard.color) {
      return { backgroundColor: namecard.color }
    }
    if ((namecard.type === 'preset' || namecard.type === 'image') && namecard.imageKey) {
      return {
        backgroundImage: `url(/api/files/${namecard.imageKey})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return {}
  }, [namecard])

  const handleProfileEdit = useCallback(() => {
    if (isEditable && onImageEdit) {
      onImageEdit('profile')
    }
  }, [isEditable, onImageEdit])

  const handleGiftClick = useCallback(() => {
    if (isEditable && onNotificationClick) {
      onNotificationClick('gift')
    }
  }, [isEditable, onNotificationClick])

  const handleMailClick = useCallback(() => {
    if (isEditable && onNotificationClick) {
      onNotificationClick('mail')
    }
  }, [isEditable, onNotificationClick])

  const handleBellClick = useCallback(() => {
    if (isEditable && onNotificationClick) {
      onNotificationClick('bell')
    }
  }, [isEditable, onNotificationClick])

  return (
    <header className={`flex justify-center w-full sticky ${inDashboard ? 'top-17' : 'top-0'} z-40 bg-[var(--theme-header-bg)]/90 backdrop-blur-sm border-b border-[var(--theme-stat-bg)] max-[992px]:hidden`}>
      <div className="flex items-center justify-between w-full max-w-[1200px] h-16 px-6">
        <div className="flex items-center">
          {/* Avatar + Name Card（編集時はクリック可能） */}
          <div
            className={`flex items-center relative group ${isEditable ? 'cursor-pointer' : ''}`}
            onClick={handleProfileEdit}
          >
            {/* Avatar Image (アイコン) */}
            <div className="w-14 h-14 rounded-l-sm rounded-r-none overflow-hidden shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3)] border-0 border-r-0 border-white/50 bg-[var(--theme-card-bg)] z-10">
              {avatarImageUrl ? (
                <Image
                  src={avatarImageUrl}
                  alt={characterName || 'Avatar'}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[var(--theme-stat-bg)]">
                  <User className="w-6 h-6 text-[var(--theme-header-text,var(--theme-text-secondary))]" />
                </div>
              )}
            </div>
            {/* Name Card */}
            <div
              className="h-14 w-56 px-4 flex items-center bg-[var(--theme-card-bg)]/90 backdrop-blur-sm rounded-r-none rounded-l-none shadow-[4px_4px_8px_rgba(0,0,0,0.05)] border border-l-0 border-white/30"
              style={namecardStyle}
            >
              <span
                className="font-bold text-[var(--theme-text-primary)] text-sm tracking-wide truncate"
                style={{ color: namecard?.textColor || undefined }}
              >
                {characterName || 'User'}
              </span>
            </div>
            {/* 編集時ホバーオーバーレイ */}
            {isEditable && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-sm">
                <Pencil className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  flex items-center gap-2
                  ${isActive
                    ? 'bg-[var(--theme-accent-bg)] text-[var(--theme-text-accent)] shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]'
                    : 'text-[var(--theme-header-text,var(--theme-text-secondary))] hover:bg-black/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}

          {/* Game Button (セパレーターで区切って配置) */}
          {visibility.gameButton && (
            <>
              <div className="w-px h-6 bg-[var(--theme-stat-bg)] mx-2" />
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 text-[var(--theme-header-text,var(--theme-text-secondary))] hover:bg-black/5"
                aria-label="Game"
              >
                <Gamepad2 className="w-4 h-4" />
                Game
              </button>
            </>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            onClick={handleGiftClick}
            disabled={!isEditable}
            aria-label="Gift"
          >
            <Gift className="w-5 h-5 text-[var(--theme-header-text,var(--theme-text-secondary))]" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
            onClick={handleMailClick}
            disabled={!isEditable}
            aria-label="Mail"
          >
            <Mail className="w-5 h-5 text-[var(--theme-header-text,var(--theme-text-secondary))]" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-black/5 transition-colors relative"
            onClick={handleBellClick}
            disabled={!isEditable}
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-[var(--theme-header-text,var(--theme-text-secondary))]" />
          </button>
        </div>
      </div>
    </header>
  )
})
