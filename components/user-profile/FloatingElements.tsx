'use client'

import { Share2, Gamepad2, Bell, Gift, Mail } from 'lucide-react'

interface FloatingElementsProps {
  visibility: {
    snsButton: boolean
    gameButton: boolean
    notification: boolean
  }
  isEditable?: boolean
  inDashboard?: boolean
  onNotificationClick?: (type: 'gift' | 'mail' | 'bell') => void
}

/**
 * フローティングボタン群
 * PC: 右下にシェアボタン
 * モバイル: 左下ゲーム、右下SNS、右上通知
 */
export function FloatingElements({
  visibility,
  isEditable = false,
  inDashboard = false,
  onNotificationClick,
}: FloatingElementsProps) {
  return (
    <>
      {/* PC: Share Button (右下) */}
      {visibility.snsButton && (
        <button
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[var(--theme-card-bg)] shadow-[var(--theme-card-shadow)] flex items-center justify-center text-[var(--theme-text-secondary)] hover:text-[var(--theme-text-accent)] hover:scale-110 transition-all max-[992px]:hidden"
          aria-label="Share"
        >
          <Share2 className="w-6 h-6" />
        </button>
      )}

      {/* Mobile: Floating Buttons */}
      <div className="min-[993px]:hidden">
        {visibility.gameButton && (
          <button
            className={`
              fixed left-4 z-40
              w-14 h-14 rounded-full
              bg-[var(--theme-card-bg)]
              shadow-[var(--theme-card-shadow)]
              flex items-center justify-center
              text-[var(--theme-text-secondary)]
              hover:text-[var(--theme-text-accent)]
              transition-all
              ${inDashboard ? 'bottom-35' : 'bottom-20'}
            `}
            aria-label="Game"
          >
            <Gamepad2 className="w-6 h-6" />
          </button>
        )}

        {visibility.snsButton && (
          <button
            className={`
              fixed right-4 z-40
              w-14 h-14 rounded-full
              bg-[var(--theme-card-bg)]
              shadow-[var(--theme-card-shadow)]
              flex items-center justify-center
              text-[var(--theme-text-secondary)]
              hover:text-[var(--theme-text-accent)]
              transition-all
              ${inDashboard ? 'bottom-35' : 'bottom-20'}
            `}
            aria-label="Share"
          >
            <Share2 className="w-6 h-6" />
          </button>
        )}

        {visibility.notification && (
          <div
            className={`fixed right-2 z-40 flex items-center gap-1 px-1 h-12 bg-black/20 backdrop-blur-sm rounded-md ${inDashboard ? 'top-20' : 'top-4'
              }`}
          >
            <button
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              aria-label="Gift"
              onClick={() => onNotificationClick?.('gift')}
              disabled={!isEditable}
            >
              <Gift className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              aria-label="Mail"
              onClick={() => onNotificationClick?.('mail')}
              disabled={!isEditable}
            >
              <Mail className="w-5 h-5" />
            </button>
            <button
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white relative"
              aria-label="Notifications"
              onClick={() => onNotificationClick?.('bell')}
              disabled={!isEditable}
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
