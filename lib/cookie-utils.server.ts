// Cookie管理ユーティリティ（サーバーサイド）

import 'server-only'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/

/**
 * サーバーサイドでCookieを解析（Next.js Request用）
 */
export function parseNotificationCookie(cookieHeader: string | undefined, userId: string): string | null {
  if (!cookieHeader) return null

  const cookieName = `notification_read_${encodeURIComponent(userId)}`
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
    return true
  }

  if (!ISO_DATE_REGEX.test(lastReadAt)) return true
  const lastReadDate = new Date(lastReadAt)
  if (isNaN(lastReadDate.getTime())) return true

  const notificationDate = new Date(notificationUpdatedAt)

  return notificationDate > lastReadDate
}
