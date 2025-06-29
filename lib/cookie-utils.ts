// Cookie管理ユーティリティ

import { NOTIFICATION_CONSTRAINTS } from "@/types/notifications"

/**
 * 通知の既読状態をCookieに保存
 */
export function setNotificationReadCookie(userId: string, timestamp: string = new Date().toISOString()) {
  if (typeof document === 'undefined') return // サーバーサイドでは実行しない

  const cookieName = `notification_read_${userId}`
  const expiresDate = new Date()
  expiresDate.setDate(expiresDate.getDate() + NOTIFICATION_CONSTRAINTS.COOKIE_EXPIRES_DAYS)

  document.cookie = `${cookieName}=${timestamp}; expires=${expiresDate.toUTCString()}; path=/; SameSite=Strict`
}

/**
 * 通知の既読状態をCookieから取得
 */
export function getNotificationReadCookie(userId: string): string | null {
  if (typeof document === 'undefined') return null // サーバーサイドでは実行しない

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
    return true // Cookie がない場合は未読
  }
  
  const lastReadDate = new Date(lastReadAt)
  const notificationDate = new Date(notificationUpdatedAt)
  
  return notificationDate > lastReadDate
}

/**
 * 通知の既読状態をCookieから削除
 */
export function clearNotificationReadCookie(userId: string) {
  if (typeof document === 'undefined') return // サーバーサイドでは実行しない

  const cookieName = `notification_read_${userId}`
  document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`
}

/**
 * サーバーサイドでCookieを解析（Next.js Request用）
 */
export function parseNotificationCookie(cookieHeader: string | undefined, userId: string): string | null {
  if (!cookieHeader) return null

  const cookieName = `notification_read_${userId}`
  const cookies = cookieHeader.split(';')
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === cookieName) {
      return value
    }
  }
  
  return null
}

/**
 * サーバーサイドで未読状態を判定
 */
export function isNotificationUnreadFromHeader(
  cookieHeader: string | undefined, 
  userId: string, 
  notificationUpdatedAt: string
): boolean {
  const lastReadAt = parseNotificationCookie(cookieHeader, userId)
  
  if (!lastReadAt) {
    return true // Cookie がない場合は未読
  }
  
  const lastReadDate = new Date(lastReadAt)
  const notificationDate = new Date(notificationUpdatedAt)
  
  return notificationDate > lastReadDate
}