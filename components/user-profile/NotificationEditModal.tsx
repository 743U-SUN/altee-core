'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { EditModal } from './EditModal'
import { getUserNotification } from '@/app/actions/user/notification-actions'

const NotificationSettings = dynamic(() =>
  import('@/app/dashboard/notifications/notification-settings').then(m => ({ default: m.NotificationSettings }))
)
const ContactSettings = dynamic(() =>
  import('@/app/dashboard/notifications/contact-settings').then(m => ({ default: m.ContactSettings }))
)
const GiftSettings = dynamic(() =>
  import('@/app/dashboard/notifications/gift-settings').then(m => ({ default: m.GiftSettings }))
)
import { getUserContact } from '@/app/actions/user/contact-actions'
import { getUserGift } from '@/app/actions/user/gift-actions'
import type { UserNotification } from '@/types/notifications'
import type { UserContact } from '@/types/contacts'
import type { UserGift } from '@/types/gift'

interface NotificationEditModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'gift' | 'mail' | 'bell'
}

/**
 * 通知設定モーダル
 * Gift/Mail/Bell アイコンクリック時に開く
 */
export function NotificationEditModal({
  isOpen,
  onClose,
  type,
}: NotificationEditModalProps) {
  const [notificationData, setNotificationData] = useState<UserNotification | null>(null)
  const [contactData, setContactData] = useState<UserContact | null>(null)
  const [giftData, setGiftData] = useState<UserGift | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    try {
      if (type === 'bell') {
        const result = await getUserNotification()
        if (result.success) {
          setNotificationData(result.data ?? null)
        } else {
          setError(result.error || '読み込みに失敗しました')
          toast.error('お知らせ設定の読み込みに失敗しました')
        }
      } else if (type === 'mail') {
        const result = await getUserContact()
        if (result.success) {
          setContactData(result.data ?? null)
        } else {
          setError(result.error || '読み込みに失敗しました')
          toast.error('連絡方法設定の読み込みに失敗しました')
        }
      } else if (type === 'gift') {
        const result = await getUserGift()
        if (result.success) {
          setGiftData(result.data ?? null)
        } else {
          setError(result.error || '読み込みに失敗しました')
          toast.error('ギフト設定の読み込みに失敗しました')
        }
      }
    } catch {
      setError('エラーが発生しました')
      toast.error('データの読み込みに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [type])

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, loadData])

  const getTitle = () => {
    switch (type) {
      case 'gift':
        return 'ギフト設定'
      case 'mail':
        return '連絡方法設定'
      case 'bell':
        return 'お知らせ設定'
    }
  }

  return (
    <EditModal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      hideActions
    >
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={loadData}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            再試行
          </button>
        </div>
      ) : (
        <>
          {type === 'bell' && (
            <NotificationSettings
              initialData={notificationData}
              showLink={false}
              showButton={false}
              compact={true}
            />
          )}
          {type === 'mail' && (
            <ContactSettings
              initialData={contactData}
              showLink={false}
              showButton={false}
              showImage={false}
              compact={true}
            />
          )}
          {type === 'gift' && (
            <GiftSettings
              initialData={giftData}
              compact={true}
            />
          )}
        </>
      )}
    </EditModal>
  )
}
