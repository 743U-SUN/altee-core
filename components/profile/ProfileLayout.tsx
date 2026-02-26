'use client'

import { memo } from 'react'
import type { ReactNode, CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface ProfileLayoutProps {
  children: ReactNode
  header?: ReactNode
  bottomNav?: ReactNode
  floatingElements?: ReactNode
  className?: string
  backgroundStyle?: CSSProperties
}

/**
 * 1カラムレイアウト
 * - フルブリードセクション対応（各SectionBandが幅・パディングを管理）
 * - MobileBottomNav / FloatingElements対応
 */
export const ProfileLayout = memo(function ProfileLayout({
  children,
  header,
  bottomNav,
  floatingElements,
  className,
  backgroundStyle,
}: ProfileLayoutProps) {
  return (
    <div
      className={cn('min-h-screen flex flex-col', className)}
      style={backgroundStyle}
    >
      {/* ヘッダー */}
      {header ? header : null}

      {/* メインコンテンツ（フルブリード） */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* ボトムナビ（モバイル） */}
      {bottomNav ? bottomNav : null}

      {/* フローティング要素 */}
      {floatingElements ? floatingElements : null}
    </div>
  )
})
