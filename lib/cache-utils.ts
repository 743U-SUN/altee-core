import 'server-only'

import { updateTag } from 'next/cache'
import { normalizeHandle } from '@/lib/validations/shared'

/** Cache tag types for user content */
export type UserCacheTag = 'profile' | 'faq' | 'news' | 'items' | 'videos'

const ALL_USER_CACHE_TAGS: UserCacheTag[] = ['profile', 'faq', 'news', 'items', 'videos']

/**
 * Invalidate specific cache tags for a user handle.
 * No-op if handle is null/undefined.
 */
export function invalidateUserCacheTags(
  handle: string | null | undefined,
  tags: UserCacheTag[]
): void {
  if (!handle) return
  const h = normalizeHandle(handle)
  for (const tag of tags) {
    updateTag(`${tag}-${h}`)
  }
}

/**
 * Invalidate all cache tags (profile, faq, news, items, videos) for a user handle.
 * No-op if handle is null/undefined.
 */
export function invalidateAllUserCacheTags(
  handle: string | null | undefined
): void {
  invalidateUserCacheTags(handle, ALL_USER_CACHE_TAGS)
}
