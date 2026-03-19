// Cookie管理ユーティリティ（クライアントサイド）

import { NOTIFICATION_CONSTRAINTS } from "@/types/notifications"

/**
 * 通知の既読状態をCookieに保存
 */
export function setNotificationReadCookie(userId: string, timestamp: string = new Date().toISOString()) {
  if (typeof document === 'undefined') return

  const cookieName = `notification_read_${userId}`
  const expiresDate = new Date()
  expiresDate.setDate(expiresDate.getDate() + NOTIFICATION_CONSTRAINTS.COOKIE_EXPIRES_DAYS)

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${cookieName}=${timestamp}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Strict${secure}`
}

/**
 * 通知の既読状態をCookieから取得
 */
export function getNotificationReadCookie(userId: string): string | null {
  if (typeof document === 'undefined') return null

  const cookieName = `notification_read_${userId}`
  const cookies = document.cookie.split(';')

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === cookieName) {
      return value
    }
  }

  return null
}

/**
 * 通知が未読かどうかを判定
 */
export function isNotificationUnread(userId: string, notificationUpdatedAt: string): boolean {
  const lastReadAt = getNotificationReadCookie(userId)

  if (!lastReadAt) {
    return true
  }

  const lastReadDate = new Date(lastReadAt)
  const notificationDate = new Date(notificationUpdatedAt)

  return notificationDate > lastReadDate
}

/**
 * 通知の既読状態をCookieから削除
 */
export function clearNotificationReadCookie(userId: string) {
  if (typeof document === 'undefined') return

  const cookieName = `notification_read_${userId}`
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict${secure}`
}
