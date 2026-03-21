'use client'

import useSWR from 'swr'
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
  const { data: notificationData, error: notificationError } = useSWR<UserNotification | null>(
    isOpen && type === 'bell' ? ['notification', type] : null,
    async () => {
      const result = await getUserNotification()
      if (!result.success) {
        toast.error('お知らせ設定の読み込みに失敗しました')
        throw new Error(result.error || '読み込みに失敗しました')
      }
      return result.data ?? null
    }
  )

  const { data: contactData, error: contactError } = useSWR<UserContact | null>(
    isOpen && type === 'mail' ? ['notification', type] : null,
    async () => {
      const result = await getUserContact()
      if (!result.success) {
        toast.error('連絡方法設定の読み込みに失敗しました')
        throw new Error(result.error || '読み込みに失敗しました')
      }
      return result.data ?? null
    }
  )

  const { data: giftData, error: giftError } = useSWR<UserGift | null>(
    isOpen && type === 'gift' ? ['notification', type] : null,
    async () => {
      const result = await getUserGift()
      if (!result.success) {
        toast.error('ギフト設定の読み込みに失敗しました')
        throw new Error(result.error || '読み込みに失敗しました')
      }
      return result.data ?? null
    }
  )

  const isLoading =
    (type === 'bell' && notificationData === undefined && !notificationError) ||
    (type === 'mail' && contactData === undefined && !contactError) ||
    (type === 'gift' && giftData === undefined && !giftError)

  const error = notificationError?.message || contactError?.message || giftError?.message || null

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
        </div>
      ) : (
        <>
          {type === 'bell' && (
            <NotificationSettings
              initialData={notificationData ?? null}
              showLink={false}
              showButton={false}
              compact={true}
            />
          )}
          {type === 'mail' && (
            <ContactSettings
              initialData={contactData ?? null}
              showLink={false}
              showButton={false}
              showImage={false}
              compact={true}
            />
          )}
          {type === 'gift' && (
            <GiftSettings
              initialData={giftData ?? null}
              compact={true}
            />
          )}
        </>
      )}
    </EditModal>
  )
}
